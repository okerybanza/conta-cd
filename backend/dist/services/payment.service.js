"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const notification_service_1 = __importDefault(require("./notification.service"));
const journalEntry_service_1 = __importDefault(require("./journalEntry.service"));
const quota_service_1 = require("./quota.service");
const realtime_service_1 = __importDefault(require("./realtime.service"));
const dashboard_service_1 = __importDefault(require("./dashboard.service"));
const audit_service_1 = __importDefault(require("./audit.service"));
const fiscalPeriod_service_1 = __importDefault(require("./fiscalPeriod.service"));
const invoiceValidation_service_1 = __importDefault(require("./invoiceValidation.service"));
const uuid_1 = require("uuid");
class PaymentService {
    // ACCT-006 Phase 2: Seuil par défaut au-delà duquel une approbation est requise avant le paiement
    static HIGH_VALUE_PAYMENT_THRESHOLD = 1_000_000; // Montant dans la devise de la facture (à affiner via configuration si besoin)
    // Mettre à jour le statut et les totaux de la facture (ARCH-007: via événement uniquement)
    async updateInvoiceStatus(companyId, invoiceId, userId) {
        // Récupérer la facture
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: invoiceId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        // Calculer le total des paiements confirmés
        const payments = await database_1.default.payments.findMany({
            where: {
                invoice_id: invoiceId,
                company_id: companyId,
                status: 'confirmed',
                deleted_at: null,
            },
        });
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const totalAmount = Number(invoice.total_amount);
        const remainingBalance = totalAmount - totalPaid;
        const tolerance = 0.01; // Tolérance pour les arrondis
        // Déterminer le nouveau statut selon les règles strictes
        let newStatus = invoice.status;
        const oldStatus = invoice.status;
        if (remainingBalance <= tolerance) {
            newStatus = 'paid';
        }
        else if (totalPaid > tolerance) {
            newStatus = 'partially_paid';
        }
        else if (invoice.status === 'sent') {
            newStatus = 'sent';
        }
        else if (invoice.status === 'draft') {
            newStatus = 'draft';
        }
        // Valider la transition de statut si elle a changé
        if (oldStatus !== newStatus) {
            try {
                invoiceValidation_service_1.default.validateStatusTransition(oldStatus, newStatus);
            }
            catch (error) {
                logger_1.default.warn('Status transition not allowed, keeping current status', {
                    companyId,
                    invoiceId,
                    oldStatus,
                    attemptedNewStatus: newStatus,
                    totalPaid,
                    remainingBalance,
                    error: error.message,
                });
                newStatus = oldStatus;
            }
        }
        // Valider la cohérence du statut avec les montants
        try {
            invoiceValidation_service_1.default.validateStatusConsistency(newStatus, totalAmount, totalPaid);
        }
        catch (error) {
            logger_1.default.warn('Status inconsistency detected, adjusting status', {
                companyId,
                invoiceId,
                status: newStatus,
                totalAmount,
                totalPaid,
                error: error.message,
            });
            if (remainingBalance <= tolerance) {
                newStatus = 'paid';
            }
            else if (totalPaid > tolerance) {
                newStatus = 'partially_paid';
            }
            else if (oldStatus === 'sent') {
                newStatus = 'sent';
            }
            else {
                newStatus = 'draft';
            }
        }
        // ARCH-007: Mise à jour facture uniquement via événement (plus de prisma.invoices.update direct)
        const invoiceChanges = {
            paid_amount: new library_1.Decimal(totalPaid),
            paid_at: remainingBalance <= tolerance ? new Date() : invoice.paid_at,
        };
        if (oldStatus !== newStatus) {
            if (newStatus === 'paid' && userId) {
                const { default: sodService } = await Promise.resolve().then(() => __importStar(require('./segregationOfDuties.service')));
                await sodService.validateNotSelfApproving(companyId, userId, 'invoice', invoiceId);
            }
            invoiceChanges.status = newStatus;
        }
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { InvoiceUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new InvoiceUpdated({ companyId, userId, timestamp: new Date() }, invoiceId, invoiceChanges, undefined));
        logger_1.default.info('Invoice updated via event (payment applied)', {
            companyId,
            invoiceId,
            totalPaid,
            newStatus: invoiceChanges.status ?? oldStatus,
        });
    }
    // Créer un paiement
    async create(companyId, userId, data) {
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: data.invoiceId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                customers: true,
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        const totalTtc = Number(invoice.total_amount);
        const currentPaid = Number(invoice.paid_amount || 0);
        // DOC-09: Valider la période
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, data.paymentDate || new Date());
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError(periodValidation.message || 'Période de paiement verrouillée ou close', 400, 'INVALID_PERIOD');
        }
        // ACCT-006 Phase 2: Approbation obligatoire pour les paiements de montant élevé
        if (data.amount >= PaymentService.HIGH_VALUE_PAYMENT_THRESHOLD) {
            const highValueApproval = await database_1.default.approval_requests.findFirst({
                where: {
                    company_id: companyId,
                    entity_type: 'invoice_payment',
                    entity_id: data.invoiceId,
                    status: 'approved',
                },
            });
            if (!highValueApproval) {
                throw new error_middleware_1.CustomError('High value payments require a prior approved approval request.', 403, 'APPROVAL_REQUIRED');
            }
        }
        // SPRINT 2 - TASK 2.2 (ACCT-014): Segregation of Duties
        // If a payment is being created AND automatically confirmed, 
        // we should ensure the user didn't create the invoice themselves.
        // Wait, the rule is usually "creator of invoice cannot pay it" OR "creator of payment cannot confirm it".
        // Let's implement: creator of invoice cannot pay it (SoD).
        if (userId && (data.status === 'confirmed' || !data.status)) {
            if (invoice.created_by === userId) {
                throw new error_middleware_1.CustomError('Segregation of Duties Violation: You cannot record a payment for an invoice that you created.', 403, 'SOD_VIOLATION');
            }
        }
        invoiceValidation_service_1.default.validatePaymentAmount(data.amount, totalTtc, currentPaid);
        if (data.paymentMethod === 'mobile_money') {
            if (!data.mobileMoneyProvider || !data.mobileMoneyNumber) {
                throw new error_middleware_1.CustomError('Mobile money provider and number are required for mobile money payments', 400, 'VALIDATION_ERROR');
            }
        }
        const isEnterpriseCustomer = invoice.customers && invoice.customers.type === 'entreprise';
        if (isEnterpriseCustomer) {
            const hasReference = !!data.transactionReference ||
                !!data.checkNumber ||
                !!data.cardLastFour ||
                !!data.reference ||
                !!data.mobileMoneyNumber;
            if (!hasReference) {
                throw new error_middleware_1.CustomError('Payment reference is required for enterprise customers.', 400, 'VALIDATION_ERROR');
            }
        }
        if (data.paymentMethod === 'bank_transfer' && !data.bankName) {
            throw new error_middleware_1.CustomError('Bank name is required for bank transfer payments', 400, 'VALIDATION_ERROR');
        }
        if (data.paymentMethod === 'check' && !data.checkNumber) {
            throw new error_middleware_1.CustomError('Check number is required for check payments', 400, 'VALIDATION_ERROR');
        }
        // CHECKLIST ÉTAPE 2 : Flux atomique - Paiement validé = écriture comptable obligatoire dans la même transaction logique
        const paymentId = (0, uuid_1.v4)();
        let payment;
        let fullPayment;
        let updatedInvoice;
        try {
            // Créer le paiement et l'écriture comptable de manière atomique
            payment = await database_1.default.$transaction(async (tx) => {
                const p = await tx.payments.create({
                    data: {
                        id: paymentId,
                        company_id: companyId,
                        invoice_id: data.invoiceId,
                        amount: new library_1.Decimal(data.amount),
                        currency: data.currency || invoice.currency || 'CDF',
                        payment_date: data.paymentDate || new Date(),
                        payment_method: data.paymentMethod,
                        mobile_money_provider: data.mobileMoneyProvider || null,
                        mobile_money_number: data.mobileMoneyNumber || null,
                        transaction_reference: data.transactionReference || null,
                        bank_name: data.bankName || null,
                        check_number: data.checkNumber || null,
                        card_last_four: data.cardLastFour || null,
                        reference: data.reference || null,
                        notes: data.notes || null,
                        status: data.status || 'confirmed',
                        created_by: userId,
                        reason: data.reason, // ACCT-001: Audit trail explanation
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
                return p;
            });
            await this.updateInvoiceStatus(companyId, data.invoiceId, userId);
            fullPayment = await this.getById(companyId, payment.id);
            updatedInvoice = await database_1.default.invoices.findUnique({ where: { id: data.invoiceId } });
            // DOC-08: Log de création
            await audit_service_1.default.logCreate(companyId, userId, undefined, undefined, 'payment', paymentId, payment, 'facturation');
            // CHECKLIST ÉTAPE 2 : Créer l'écriture comptable (obligatoire) - si échec, le paiement doit être annulé
            await this.createJournalEntryForPayment(companyId, fullPayment, userId);
        }
        catch (error) {
            // CHECKLIST ÉTAPE 2 : Erreur bloquante - Si l'écriture comptable échoue, le paiement ne doit pas être validé
            logger_1.default.error(`Failed to create accounting entry for payment ${paymentId}`, {
                error: error.message,
                stack: error.stack,
                companyId,
                paymentId,
            });
            // Annuler le paiement si l'écriture comptable a échoué
            if (payment) {
                try {
                    await database_1.default.payments.delete({ where: { id: paymentId } });
                    await this.updateInvoiceStatus(companyId, data.invoiceId, userId); // Recalculer le statut de la facture
                }
                catch (deleteError) {
                    logger_1.default.error(`Failed to rollback payment after accounting entry failure`, {
                        paymentId,
                        error: deleteError.message,
                    });
                }
            }
            throw new error_middleware_1.CustomError(`Impossible de valider le paiement : ${error.message}`, 500, 'PAYMENT_VALIDATION_FAILED', { originalError: error.message });
        }
        if (payment.status === 'confirmed' && updatedInvoice) {
            try {
                await notification_service_1.default.sendPaymentNotification({
                    invoiceId: updatedInvoice.id,
                    companyId,
                    customerId: updatedInvoice.customer_id,
                    invoiceNumber: updatedInvoice.invoice_number,
                    paymentDate: payment.payment_date.toISOString(),
                    amount: Number(payment.amount),
                    currency: payment.currency || 'CDF',
                    paymentMethod: payment.payment_method,
                    remainingBalance: Number(updatedInvoice.total_amount) - Number(updatedInvoice.paid_amount || 0),
                    methods: ['email', 'whatsapp'],
                });
            }
            catch (error) {
                logger_1.default.error('Error sending payment notification', { paymentId: payment.id, error: error.message });
            }
        }
        realtime_service_1.default.emitPaymentCreated(companyId, fullPayment);
        try {
            const stats = await dashboard_service_1.default.getDashboardStats(companyId);
            realtime_service_1.default.emitDashboardStatsUpdate(companyId, stats);
        }
        catch (error) {
            logger_1.default.error('Error updating dashboard stats', { companyId, error: error.message });
        }
        return fullPayment;
    }
    async createJournalEntryForPayment(companyId, payment, userId) {
        try {
            const quotaService = new quota_service_1.QuotaService();
            const hasAccounting = await quotaService.checkFeature(companyId, 'accounting');
            if (!hasAccounting)
                return;
            await journalEntry_service_1.default.createForPayment(companyId, payment.id, {
                paymentDate: payment.payment_date,
                currency: payment.currency || 'CDF',
                invoiceId: payment.invoice_id || undefined,
                expenseId: undefined,
                paymentMethod: payment.payment_method,
                createdBy: userId,
            });
            logger_1.default.info(`Journal entry created for payment: ${payment.id}`, { companyId, paymentId: payment.id });
        }
        catch (error) {
            logger_1.default.error('Error creating journal entry for payment', { paymentId: payment.id, error: error.message });
        }
    }
    async getById(companyId, paymentId) {
        const payment = await database_1.default.payments.findFirst({
            where: {
                id: paymentId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                invoices: {
                    select: {
                        id: true,
                        invoice_number: true,
                        customer_id: true,
                        total_amount: true,
                        paid_amount: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
        if (!payment) {
            throw new error_middleware_1.CustomError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
        }
        return payment;
    }
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.invoiceId) {
            where.invoice_id = filters.invoiceId;
        }
        if (filters.paymentMethod) {
            where.payment_method = filters.paymentMethod;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            where.payment_date = {};
            if (filters.startDate) {
                where.payment_date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.payment_date.lte = new Date(filters.endDate);
            }
        }
        const [payments, total] = await Promise.all([
            database_1.default.payments.findMany({
                where,
                include: {
                    invoices: {
                        select: {
                            id: true,
                            invoice_number: true,
                            customer_id: true,
                            customers: {
                                select: {
                                    id: true,
                                    type: true,
                                    first_name: true,
                                    last_name: true,
                                    business_name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { payment_date: 'desc' },
            }),
            database_1.default.payments.count({ where }),
        ]);
        // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
        const mappedPayments = payments.map((payment) => ({
            id: payment.id,
            companyId: payment.company_id,
            invoiceId: payment.invoice_id,
            amount: Number(payment.amount),
            currency: payment.currency,
            paymentDate: payment.payment_date?.toISOString() || null,
            paymentMethod: payment.payment_method,
            mobileMoneyProvider: payment.mobile_money_provider,
            mobileMoneyNumber: payment.mobile_money_number,
            transactionReference: payment.transaction_reference,
            bankName: payment.bank_name,
            checkNumber: payment.check_number,
            cardLastFour: payment.card_last_four,
            reference: payment.reference,
            notes: payment.notes,
            status: payment.status,
            createdBy: payment.created_by,
            invoice: payment.invoices ? {
                id: payment.invoices.id,
                invoiceNumber: payment.invoices.invoice_number,
                customerId: payment.invoices.customer_id,
                customer: payment.invoices.customers ? {
                    id: payment.invoices.customers.id,
                    type: payment.invoices.customers.type,
                    firstName: payment.invoices.customers.first_name,
                    lastName: payment.invoices.customers.last_name,
                    businessName: payment.invoices.customers.business_name,
                    email: payment.invoices.customers.email,
                } : null,
            } : null,
            creator: payment.users ? {
                id: payment.users.id,
                firstName: payment.users.first_name,
                lastName: payment.users.last_name,
            } : null,
            createdAt: payment.created_at?.toISOString() || null,
            updatedAt: payment.updated_at?.toISOString() || null,
        }));
        return {
            data: mappedPayments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async update(companyId, paymentId, data) {
        const existingPayment = await this.getById(companyId, paymentId);
        if (existingPayment.status === 'confirmed' && data.amount !== undefined) {
            const invoice = await database_1.default.invoices.findFirst({
                where: {
                    id: existingPayment.invoice_id,
                    company_id: companyId,
                    deleted_at: null,
                },
            });
            if (invoice) {
                const otherPayments = await database_1.default.payments.findMany({
                    where: {
                        invoice_id: invoice.id,
                        company_id: companyId,
                        id: { not: paymentId },
                        status: 'confirmed',
                        deleted_at: null,
                    },
                });
                const otherPaymentsTotal = otherPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const totalAmount = Number(invoice.total_amount);
                const availableBalance = totalAmount - otherPaymentsTotal;
                if (data.amount > availableBalance) {
                    throw new error_middleware_1.CustomError(`Payment amount (${data.amount}) exceeds available balance (${availableBalance})`, 400, 'AMOUNT_EXCEEDS_BALANCE');
                }
            }
        }
        const payment = await database_1.default.payments.update({
            where: { id: paymentId },
            data: {
                ...(data.amount !== undefined && { amount: new library_1.Decimal(data.amount) }),
                ...(data.currency !== undefined && { currency: data.currency }),
                ...(data.paymentDate !== undefined && { payment_date: data.paymentDate }),
                ...(data.paymentMethod !== undefined && { payment_method: data.paymentMethod }),
                ...(data.mobileMoneyProvider !== undefined && {
                    mobile_money_provider: data.mobileMoneyProvider,
                }),
                ...(data.mobileMoneyNumber !== undefined && {
                    mobile_money_number: data.mobileMoneyNumber,
                }),
                ...(data.transactionReference !== undefined && {
                    transaction_reference: data.transactionReference,
                }),
                ...(data.bankName !== undefined && { bank_name: data.bankName }),
                ...(data.checkNumber !== undefined && { check_number: data.checkNumber }),
                ...(data.cardLastFour !== undefined && { card_last_four: data.cardLastFour }),
                ...(data.reference !== undefined && { reference: data.reference }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.status !== undefined && { status: data.status }),
            },
        });
        // DOC-08: Log de mise à jour
        await audit_service_1.default.logUpdate(companyId, undefined, undefined, undefined, 'payment', paymentId, existingPayment, payment, 'facturation');
        await this.updateInvoiceStatus(companyId, existingPayment.invoice_id);
        logger_1.default.info(`Payment updated: ${paymentId}`, { companyId, paymentId });
        return this.getById(companyId, paymentId);
    }
    async delete(companyId, paymentId) {
        const payment = await this.getById(companyId, paymentId);
        const invoice_id = payment.invoice_id;
        await database_1.default.payments.update({
            where: { id: paymentId },
            data: { deleted_at: new Date(), updated_at: new Date() },
        });
        // DOC-08: Log de suppression
        await audit_service_1.default.logDelete(companyId, undefined, undefined, undefined, 'payment', paymentId, payment, 'facturation');
        await this.updateInvoiceStatus(companyId, invoice_id);
        logger_1.default.info(`Payment deleted: ${paymentId}`, { companyId, paymentId, invoiceId: invoice_id });
        return { success: true };
    }
    async getByInvoice(companyId, invoiceId) {
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: invoiceId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        const payments = await database_1.default.payments.findMany({
            where: {
                invoice_id: invoiceId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
            orderBy: { payment_date: 'desc' },
        });
        return payments;
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
//# sourceMappingURL=payment.service.js.map