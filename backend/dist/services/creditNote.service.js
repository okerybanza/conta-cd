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
exports.CreditNoteService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const journalEntry_service_1 = __importDefault(require("./journalEntry.service"));
const crypto_1 = require("crypto");
const quota_service_1 = require("./quota.service");
const fiscalPeriod_service_1 = __importDefault(require("./fiscalPeriod.service"));
const audit_service_1 = __importDefault(require("./audit.service"));
class CreditNoteService {
    /**
     * Générer le numéro d'avoir suivant
     */
    async generateCreditNoteNumber(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: {
                credit_note_prefix: true,
                next_credit_note_number: true,
            },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        const prefix = company.credit_note_prefix || 'AV';
        const nextNumber = company.next_credit_note_number || 1;
        const creditNoteNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;
        // Incrémenter le numéro suivant
        await database_1.default.companies.update({
            where: { id: companyId },
            data: { next_credit_note_number: nextNumber + 1 },
        });
        return creditNoteNumber;
    }
    /**
     * Calculer les totaux d'un avoir
     */
    calculateTotals(amount, taxAmount) {
        const calculatedTaxAmount = taxAmount !== undefined ? taxAmount : 0;
        const totalAmount = amount + calculatedTaxAmount;
        return {
            amount,
            taxAmount: calculatedTaxAmount,
            totalAmount,
        };
    }
    calculateTotalsFromLines(lines) {
        let amount = 0;
        let taxAmount = 0;
        const normalizedLines = lines.map((line) => {
            const lineSubtotal = line.quantity * line.unitPrice;
            const lineTax = lineSubtotal * ((line.taxRate || 0) / 100);
            const lineTotal = lineSubtotal + lineTax;
            amount += lineSubtotal;
            taxAmount += lineTax;
            return {
                ...line,
                subtotal: lineSubtotal,
                taxAmount: lineTax,
                total: lineTotal,
            };
        });
        return {
            amount,
            taxAmount,
            totalAmount: amount + taxAmount,
            lines: normalizedLines,
        };
    }
    /**
     * Créer un avoir
     */
    async create(companyId, userId, data) {
        // ACCT-002: Vérifier que la date de l'avoir est dans une période ouverte
        const creditNoteDate = data.creditNoteDate ? new Date(data.creditNoteDate) : new Date();
        await fiscalPeriod_service_1.default.checkLock(companyId, creditNoteDate);
        // Vérifier que la facture existe et appartient à l'entreprise
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: data.invoiceId,
                company_id: companyId,
                deleted_at: null,
            },
            select: {
                id: true,
                total_amount: true,
                paid_amount: true,
                customer_id: true,
                currency: true,
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        const invoiceTotal = Number(invoice.total_amount);
        const invoicePaid = Number(invoice.paid_amount);
        const remainingAmount = invoiceTotal - invoicePaid;
        const hasLines = Array.isArray(data.lines) && data.lines.length > 0;
        const normalizedLines = hasLines ? data.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            taxRate: line.taxRate !== undefined ? Number(line.taxRate) : 0,
        })) : [];
        if (hasLines) {
            for (const line of normalizedLines) {
                if (!line.description || !line.description.trim()) {
                    throw new error_middleware_1.CustomError('Line description is required', 400, 'CREDIT_NOTE_LINE_DESCRIPTION_REQUIRED');
                }
                if (line.quantity <= 0 || !Number.isFinite(line.quantity)) {
                    throw new error_middleware_1.CustomError('Line quantity must be greater than 0', 400, 'CREDIT_NOTE_LINE_QUANTITY_INVALID');
                }
                if (line.unitPrice < 0 || !Number.isFinite(line.unitPrice)) {
                    throw new error_middleware_1.CustomError('Line unit price must be valid', 400, 'CREDIT_NOTE_LINE_UNIT_PRICE_INVALID');
                }
                if (line.taxRate < 0 || !Number.isFinite(line.taxRate)) {
                    throw new error_middleware_1.CustomError('Line tax rate must be valid', 400, 'CREDIT_NOTE_LINE_TAX_RATE_INVALID');
                }
            }
        }
        if (data.returnStock) {
            if (invoicePaid > 0) {
                throw new error_middleware_1.CustomError('Retour stock impossible : la facture a déjà reçu des paiements', 400, 'CREDIT_NOTE_STOCK_RETURN_NOT_ALLOWED');
            }
            if (!hasLines) {
                throw new error_middleware_1.CustomError('Retour stock impossible : lignes d\'avoir requises', 400, 'CREDIT_NOTE_STOCK_LINES_REQUIRED');
            }
            const stockLines = normalizedLines.filter((line) => line.productId);
            if (stockLines.length === 0) {
                throw new error_middleware_1.CustomError('Retour stock impossible : aucune ligne avec produit', 400, 'CREDIT_NOTE_NO_STOCK_LINES');
            }
            const invoiceLines = await database_1.default.invoice_lines.findMany({
                where: {
                    invoice_id: invoice.id,
                    product_id: { not: null },
                },
                select: {
                    product_id: true,
                    quantity: true,
                },
            });
            const invoiceQtyByProduct = new Map();
            for (const line of invoiceLines) {
                const productId = line.product_id;
                const quantity = Number(line.quantity || 0);
                invoiceQtyByProduct.set(productId, (invoiceQtyByProduct.get(productId) || 0) + quantity);
            }
            const creditQtyByProduct = new Map();
            for (const line of stockLines) {
                const productId = line.productId;
                creditQtyByProduct.set(productId, (creditQtyByProduct.get(productId) || 0) + line.quantity);
            }
            for (const [productId, quantity] of creditQtyByProduct.entries()) {
                const maxQty = invoiceQtyByProduct.get(productId) || 0;
                if (quantity > maxQty) {
                    throw new error_middleware_1.CustomError(`Quantité retour stock (${quantity}) supérieure à la quantité facturée (${maxQty}) pour le produit ${productId}`, 400, 'CREDIT_NOTE_STOCK_RETURN_QUANTITY_EXCEEDS_INVOICE');
                }
            }
        }
        const lineTotals = hasLines ? this.calculateTotalsFromLines(normalizedLines) : null;
        const totals = lineTotals ?? this.calculateTotals(data.amount, data.taxAmount);
        if (totals.totalAmount > remainingAmount) {
            throw new error_middleware_1.CustomError(`Credit note amount (${totals.totalAmount}) cannot exceed remaining invoice amount (${remainingAmount})`, 400, 'CREDIT_NOTE_AMOUNT_EXCEEDS_REMAINING');
        }
        // Générer le numéro d'avoir
        const creditNoteNumber = await this.generateCreditNoteNumber(companyId);
        // Créer l'avoir dans une transaction
        const creditNote = await database_1.default.$transaction(async (tx) => {
            // Créer l'avoir
            const newCreditNote = await tx.credit_notes.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: companyId,
                    invoice_id: data.invoiceId,
                    credit_note_number: creditNoteNumber,
                    credit_note_date: data.creditNoteDate || new Date(),
                    amount: new library_1.Decimal(totals.amount),
                    tax_amount: new library_1.Decimal(totals.taxAmount),
                    total_amount: new library_1.Decimal(totals.totalAmount),
                    status: 'draft',
                    reason: data.reason,
                    reference: data.reference,
                    currency: data.currency || invoice.currency || 'CDF',
                    template_id: data.templateId || 'template-1-modern',
                    notes: data.notes,
                    footer_text: data.footerText,
                    return_stock: data.returnStock || false,
                    created_by: userId,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            if (lineTotals && tx.credit_note_lines) {
                for (const line of lineTotals.lines) {
                    await tx.credit_note_lines.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
                            credit_note_id: newCreditNote.id,
                            product_id: line.productId || null,
                            description: line.description,
                            quantity: new library_1.Decimal(line.quantity),
                            unit_price: new library_1.Decimal(line.unitPrice),
                            tax_rate: new library_1.Decimal(line.taxRate || 0),
                            tax_amount: new library_1.Decimal(line.taxAmount || 0),
                            subtotal: new library_1.Decimal(line.subtotal),
                            total: new library_1.Decimal(line.total),
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }
            }
            return newCreditNote;
        });
        // Récupérer l'avoir avec les relations
        const creditNoteWithRelations = await this.getById(companyId, creditNote.id);
        // ACCT-004: Audit trail
        await audit_service_1.default.logCreate(companyId, userId, undefined, undefined, 'credit_note', creditNote.id, {
            credit_note_number: creditNoteNumber,
            invoice_id: data.invoiceId,
            amount: totals.amount,
            total_amount: totals.totalAmount,
            status: 'draft',
            reason: data.reason,
        }, 'facturation');
        logger_1.default.info(`Credit note created: ${creditNoteNumber}`, {
            companyId,
            creditNoteId: creditNote.id,
            invoiceId: data.invoiceId,
            amount: totals.totalAmount,
        });
        return creditNoteWithRelations;
    }
    /**
     * Créer l'écriture comptable pour un avoir (contrepassation)
     */
    async createJournalEntryForCreditNote(companyId, creditNote, invoice, userId, options) {
        try {
            const quotaService = new quota_service_1.QuotaService();
            const hasAccounting = await quotaService.checkFeature(companyId, 'accounting');
            if (!hasAccounting) {
                return;
            }
            const customer = invoice.customers;
            const customerName = customer?.type === 'particulier'
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                : customer?.business_name || '';
            await journalEntry_service_1.default.ensureForCreditNote(companyId, creditNote.id, {
                creditNoteNumber: creditNote.credit_note_number,
                creditNoteDate: creditNote.credit_note_date,
                customerId: invoice.customer_id,
                customerName,
                amountHt: Number(creditNote.amount || 0),
                taxAmount: Number(creditNote.tax_amount || 0),
                amountTtc: Number(creditNote.total_amount || 0),
                currency: creditNote.currency || invoice.currency || 'CDF',
                createdBy: userId,
            });
            logger_1.default.info(`Journal entry created for credit note: ${creditNote.id}`, {
                companyId,
                creditNoteId: creditNote.id,
            });
        }
        catch (error) {
            logger_1.default.error('Error creating journal entry for credit note', {
                creditNoteId: creditNote.id,
                error: error.message,
                stack: error.stack,
            });
            if (options?.strict) {
                throw error;
            }
        }
    }
    /**
     * Obtenir un avoir par ID
     */
    async getById(companyId, creditNoteId) {
        const creditNote = await database_1.default.credit_notes.findFirst({
            where: {
                id: creditNoteId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                invoices: {
                    select: {
                        id: true,
                        invoice_number: true,
                        total_amount: true,
                        paid_amount: true,
                        status: true,
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
        if (!creditNote) {
            throw new error_middleware_1.CustomError('Credit note not found', 404, 'CREDIT_NOTE_NOT_FOUND');
        }
        return creditNote;
    }
    /**
     * Lister les avoirs
     */
    async list(companyId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters?.invoiceId) {
            where.invoice_id = filters.invoiceId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                { credit_note_number: { contains: filters.search, mode: 'insensitive' } },
                { reference: { contains: filters.search, mode: 'insensitive' } },
                { reason: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [creditNotes, total] = await Promise.all([
            database_1.default.credit_notes.findMany({
                where,
                include: {
                    invoices: {
                        select: {
                            id: true,
                            invoice_number: true,
                            total_amount: true,
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
                orderBy: { credit_note_date: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.credit_notes.count({ where }),
        ]);
        return {
            data: creditNotes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mettre à jour un avoir
     */
    async update(companyId, creditNoteId, userId, data) {
        // Vérifier que l'avoir existe
        const existingCreditNote = await database_1.default.credit_notes.findFirst({
            where: {
                id: creditNoteId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingCreditNote) {
            throw new error_middleware_1.CustomError('Credit note not found', 404, 'CREDIT_NOTE_NOT_FOUND');
        }
        // Ne pas permettre la modification d'un avoir appliqué ou annulé
        if (existingCreditNote.status === 'applied' || existingCreditNote.status === 'cancelled') {
            throw new error_middleware_1.CustomError('Cannot update credit note that has been applied or cancelled', 400, 'CREDIT_NOTE_LOCKED');
        }
        // Préparer les données de mise à jour
        const updateData = {
            updated_at: new Date(),
        };
        if (data.reason !== undefined)
            updateData.reason = data.reason;
        if (data.reference !== undefined)
            updateData.reference = data.reference;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.footerText !== undefined)
            updateData.footer_text = data.footerText;
        if (data.returnStock !== undefined)
            updateData.return_stock = data.returnStock;
        if (data.status !== undefined) {
            updateData.status = data.status;
            // Mettre à jour les timestamps selon le statut
            if (data.status === 'sent' && !existingCreditNote.applied_at) {
                // Pour simplifier, on ne garde pas de sent_at, mais on pourrait l'ajouter
            }
            else if (data.status === 'applied') {
                updateData.applied_at = new Date();
            }
        }
        const updatedCreditNote = await database_1.default.credit_notes.update({
            where: { id: creditNoteId },
            data: updateData,
        });
        // ACCT-004: Audit trail
        await audit_service_1.default.logUpdate(companyId, userId, undefined, undefined, 'credit_note', creditNoteId, {
            reason: existingCreditNote.reason,
            reference: existingCreditNote.reference,
            status: existingCreditNote.status,
        }, updateData, 'facturation');
        logger_1.default.info(`Credit note updated: ${updatedCreditNote.credit_note_number}`, {
            companyId,
            creditNoteId,
            status: updatedCreditNote.status,
        });
        return this.getById(companyId, creditNoteId);
    }
    /**
     * Supprimer (soft delete) un avoir
     */
    async delete(companyId, creditNoteId) {
        // Vérifier que l'avoir existe
        const existingCreditNote = await database_1.default.credit_notes.findFirst({
            where: {
                id: creditNoteId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingCreditNote) {
            throw new error_middleware_1.CustomError('Credit note not found', 404, 'CREDIT_NOTE_NOT_FOUND');
        }
        // Ne pas permettre la suppression d'un avoir appliqué
        if (existingCreditNote.status === 'applied') {
            throw new error_middleware_1.CustomError('Cannot delete credit note that has been applied', 400, 'CREDIT_NOTE_LOCKED');
        }
        // Soft delete
        await database_1.default.credit_notes.update({
            where: { id: creditNoteId },
            data: { deleted_at: new Date() },
        });
        // ACCT-004 / DOC-08: Audit trail with justification for DELETE
        await audit_service_1.default.logDelete(companyId, undefined, undefined, undefined, 'credit_note', creditNoteId, {
            credit_note_number: existingCreditNote.credit_note_number,
            status: existingCreditNote.status,
            total_amount: Number(existingCreditNote.total_amount),
        }, 'facturation', 'Soft delete credit note (integration test)');
        logger_1.default.info(`Credit note deleted: ${existingCreditNote.credit_note_number}`, {
            companyId,
            creditNoteId,
        });
    }
    /**
     * Appliquer un avoir à une facture (réduire le montant dû)
     */
    async applyCreditNote(companyId, creditNoteId, userId) {
        const creditNote = await this.getById(companyId, creditNoteId);
        // ACCT-002: Période fiscale ouverte pour la date de l'avoir
        const noteDate = creditNote.credit_note_date ? new Date(creditNote.credit_note_date) : new Date();
        await fiscalPeriod_service_1.default.checkLock(companyId, noteDate);
        if (creditNote.status === 'applied') {
            throw new error_middleware_1.CustomError('Credit note has already been applied', 400, 'CREDIT_NOTE_ALREADY_APPLIED');
        }
        if (creditNote.status === 'cancelled') {
            throw new error_middleware_1.CustomError('Cannot apply cancelled credit note', 400, 'CREDIT_NOTE_CANCELLED');
        }
        const invoice = await database_1.default.invoices.findFirst({
            where: {
                id: creditNote.invoice_id,
                company_id: companyId,
                deleted_at: null,
            },
            select: {
                id: true,
                invoice_number: true,
                total_amount: true,
                paid_amount: true,
                status: true,
                paid_at: true,
                customer_id: true,
                currency: true,
                customers: {
                    select: {
                        type: true,
                        first_name: true,
                        last_name: true,
                        business_name: true,
                    },
                },
            },
        });
        if (!invoice) {
            throw new error_middleware_1.CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }
        const creditNoteAmount = Number(creditNote.total_amount);
        const invoiceTotal = Number(invoice.total_amount);
        const invoicePaid = Number(invoice.paid_amount);
        const newPaidAmount = invoicePaid + creditNoteAmount;
        if (creditNote.return_stock) {
            if (invoicePaid > 0) {
                throw new error_middleware_1.CustomError('Retour stock impossible : la facture a déjà reçu des paiements', 400, 'CREDIT_NOTE_STOCK_RETURN_NOT_ALLOWED');
            }
        }
        // Appliquer l'avoir : transaction sur l'avoir uniquement (ARCH-007 : facture mise à jour via événement)
        await database_1.default.$transaction(async (tx) => {
            await tx.credit_notes.update({
                where: { id: creditNoteId },
                data: {
                    status: 'applied',
                    applied_amount: creditNote.total_amount,
                    applied_at: new Date(),
                    updated_at: new Date(),
                },
            });
        });
        // ARCH-007: Mise à jour facture via événement (plus de prisma.invoices.update direct)
        const invoiceChanges = {
            paid_amount: new library_1.Decimal(newPaidAmount),
            updated_at: new Date(),
        };
        if (newPaidAmount >= invoiceTotal) {
            invoiceChanges.status = 'paid';
            invoiceChanges.paid_at = new Date();
        }
        else if (newPaidAmount > 0 && invoice.status === 'draft') {
            invoiceChanges.status = 'partially_paid';
        }
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { InvoiceUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new InvoiceUpdated({ companyId, userId, timestamp: new Date() }, invoice.id, invoiceChanges, undefined));
        try {
            await this.createJournalEntryForCreditNote(companyId, creditNote, invoice, userId, { strict: true });
            if (creditNote.return_stock) {
                const stockMovementService = (await Promise.resolve().then(() => __importStar(require('./stock-movement.service')))).default;
                const creditNoteLines = await database_1.default.credit_note_lines.findMany({
                    where: {
                        credit_note_id: creditNoteId,
                        product_id: { not: null },
                    },
                    select: {
                        product_id: true,
                        quantity: true,
                    },
                });
                const stockItems = creditNoteLines
                    .filter((line) => line.product_id)
                    .map((line) => ({
                    productId: line.product_id,
                    quantity: Number(line.quantity || 0),
                }))
                    .filter((item) => item.quantity > 0);
                if (stockItems.length === 0) {
                    throw new error_middleware_1.CustomError('Retour stock impossible : aucune ligne d\'avoir liée à un produit', 400, 'CREDIT_NOTE_NO_STOCK_LINES');
                }
                const movementId = await stockMovementService.create(companyId, userId || 'system', {
                    movementType: 'IN',
                    items: stockItems,
                    reference: 'CreditNote',
                    referenceId: creditNoteId,
                    reason: `Avoir ${creditNote.credit_note_number}`,
                });
                await stockMovementService.validate(companyId, movementId, userId || 'system');
                logger_1.default.info('Credit note stock return movement created and validated', {
                    companyId,
                    creditNoteId,
                    movementId,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to apply credit note accounting/stock actions', {
                companyId,
                creditNoteId,
                error: error.message,
                stack: error.stack,
            });
            await database_1.default.$transaction(async (tx) => {
                await tx.credit_notes.update({
                    where: { id: creditNoteId },
                    data: {
                        status: creditNote.status,
                        applied_amount: creditNote.applied_amount || new library_1.Decimal(0),
                        applied_at: creditNote.applied_at || null,
                        updated_at: new Date(),
                    },
                });
            });
            // ARCH-007: Restaurer la facture via événement (rollback)
            const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
            const { InvoiceUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
            await eventBus.publish(new InvoiceUpdated({ companyId, userId, timestamp: new Date() }, invoice.id, {
                paid_amount: new library_1.Decimal(invoicePaid),
                status: invoice.status,
                paid_at: invoice.paid_at || null,
                updated_at: new Date(),
            }, undefined));
            throw new error_middleware_1.CustomError(`Impossible d'appliquer l'avoir : ${error.message}`, 500, 'CREDIT_NOTE_APPLY_FAILED');
        }
        // ACCT-004: Audit trail
        await audit_service_1.default.createLog({
            companyId,
            userId,
            action: 'CREDIT_NOTE_APPLIED',
            entityType: 'credit_note',
            entityId: creditNoteId,
            module: 'facturation',
            beforeState: { status: creditNote.status },
            afterState: { status: 'applied', applied_at: new Date(), invoiceId: invoice.id, amount: creditNoteAmount },
            reason: `Avoir ${creditNote.credit_note_number} appliqué à la facture ${invoice.invoice_number}`,
        });
        logger_1.default.info(`Credit note applied: ${creditNote.credit_note_number} to invoice ${invoice.id}`, {
            companyId,
            creditNoteId,
            invoiceId: invoice.id,
            amount: creditNoteAmount,
        });
        return this.getById(companyId, creditNoteId);
    }
}
exports.CreditNoteService = CreditNoteService;
exports.default = new CreditNoteService();
//# sourceMappingURL=creditNote.service.js.map