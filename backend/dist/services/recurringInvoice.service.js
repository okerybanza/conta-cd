"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringInvoiceService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const invoice_service_1 = __importDefault(require("./invoice.service"));
const uuid_1 = require("uuid");
class RecurringInvoiceService {
    /**
     * Calculer la prochaine date d'exécution
     */
    calculateNextRunDate(startDate, frequency, interval = 1, lastRunDate) {
        const baseDate = lastRunDate || startDate;
        const nextDate = new Date(baseDate);
        switch (frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7 * interval);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3 * interval);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + interval);
                break;
            default:
                throw new error_middleware_1.CustomError(`Invalid frequency: ${frequency}`, 400, 'INVALID_FREQUENCY');
        }
        return nextDate;
    }
    /**
     * Calculer les totaux
     */
    calculateTotals(lines, transportFees = 0, platformFees = 0) {
        let subtotalHt = 0;
        let totalTax = 0;
        for (const line of lines) {
            const lineSubtotal = line.quantity * line.unitPrice;
            const lineTax = lineSubtotal * ((line.taxRate || 0) / 100);
            subtotalHt += lineSubtotal;
            totalTax += lineTax;
        }
        const totalTtc = subtotalHt + totalTax + transportFees + platformFees;
        return {
            subtotal: new library_1.Decimal(subtotalHt),
            taxAmount: new library_1.Decimal(totalTax),
            totalAmount: new library_1.Decimal(totalTtc),
        };
    }
    /**
     * Créer une facture récurrente
     */
    async create(companyId, userId, data) {
        // Vérifier que le client existe
        const customer = await database_1.default.customers.findFirst({
            where: {
                id: data.customerId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!customer) {
            throw new error_middleware_1.CustomError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
        }
        // Validation des lignes
        if (!data.lines || data.lines.length === 0) {
            throw new error_middleware_1.CustomError('Recurring invoice must have at least one line', 400, 'VALIDATION_ERROR');
        }
        // Calculer les totaux
        const totals = this.calculateTotals(data.lines, data.transportFees || 0, data.platformFees || 0);
        // Calculer la prochaine date d'exécution
        const nextRunDate = this.calculateNextRunDate(data.startDate, data.frequency, data.interval || 1);
        // Créer la facture récurrente avec les lignes dans une transaction
        const recurringInvoice = await database_1.default.$transaction(async (tx) => {
            // Créer la facture récurrente
            const newRecurringInvoice = await tx.recurring_invoices.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    company_id: companyId,
                    customer_id: data.customerId,
                    name: data.name,
                    description: data.description,
                    frequency: data.frequency,
                    start_date: data.startDate,
                    end_date: data.endDate ? new Date(data.endDate) : null,
                    next_run_date: nextRunDate,
                    currency: data.currency || 'CDF',
                    notes: data.notes,
                    payment_terms: data.paymentTerms,
                    subtotal: totals.subtotal,
                    tax_amount: totals.taxAmount,
                    total_amount: totals.totalAmount,
                    template_id: 'template-1-modern',
                    is_active: true,
                    created_by: userId,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            // Créer les lignes
            for (const lineData of data.lines) {
                const lineSubtotal = lineData.quantity * lineData.unitPrice;
                const lineTax = lineSubtotal * ((lineData.taxRate || 0) / 100);
                const lineTotal = lineSubtotal + lineTax;
                await tx.recurring_invoice_lines.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        recurring_invoice_id: newRecurringInvoice.id,
                        product_id: lineData.productId || null,
                        description: lineData.description || lineData.name,
                        quantity: new library_1.Decimal(lineData.quantity),
                        unit_price: new library_1.Decimal(lineData.unitPrice),
                        tax_rate: new library_1.Decimal(lineData.taxRate || 0),
                        tax_amount: new library_1.Decimal(lineTax),
                        subtotal: new library_1.Decimal(lineSubtotal),
                        total: new library_1.Decimal(lineTotal),
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }
            return newRecurringInvoice;
        });
        // Récupérer la facture récurrente avec les relations
        const recurringInvoiceWithRelations = await this.getById(companyId, recurringInvoice.id);
        logger_1.default.info(`Recurring invoice created: ${data.name}`, {
            companyId,
            recurringInvoiceId: recurringInvoice.id,
            customerId: data.customerId,
            frequency: data.frequency,
        });
        return recurringInvoiceWithRelations;
    }
    /**
     * Obtenir une facture récurrente par ID
     */
    async getById(companyId, recurringInvoiceId) {
        const recurringInvoice = await database_1.default.recurring_invoices.findFirst({
            where: {
                id: recurringInvoiceId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                customers: {
                    select: {
                        id: true,
                        business_name: true,
                        first_name: true,
                        last_name: true,
                        type: true,
                    },
                },
                recurring_invoice_lines: {
                    include: {
                        products: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                            },
                        },
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
        if (!recurringInvoice) {
            throw new error_middleware_1.CustomError('Recurring invoice not found', 404, 'RECURRING_INVOICE_NOT_FOUND');
        }
        return recurringInvoice;
    }
    /**
     * Lister les factures récurrentes
     */
    async list(companyId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters?.isActive !== undefined) {
            where.is_active = filters.isActive;
        }
        if (filters?.customerId) {
            where.customer_id = filters.customerId;
        }
        const [recurringInvoices, total] = await Promise.all([
            database_1.default.recurring_invoices.findMany({
                where,
                include: {
                    customers: {
                        select: {
                            id: true,
                            business_name: true,
                            first_name: true,
                            last_name: true,
                            type: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.recurring_invoices.count({ where }),
        ]);
        return {
            data: recurringInvoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Mettre à jour une facture récurrente
     */
    async update(companyId, recurringInvoiceId, data) {
        // Vérifier que la facture récurrente existe
        const existingRecurringInvoice = await database_1.default.recurring_invoices.findFirst({
            where: {
                id: recurringInvoiceId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingRecurringInvoice) {
            throw new error_middleware_1.CustomError('Recurring invoice not found', 404, 'RECURRING_INVOICE_NOT_FOUND');
        }
        // Préparer les données de mise à jour
        const updateData = {
            updated_at: new Date(),
        };
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.frequency !== undefined)
            updateData.frequency = data.frequency;
        if (data.startDate !== undefined)
            updateData.start_date = new Date(data.startDate);
        if (data.endDate !== undefined)
            updateData.end_date = data.endDate ? new Date(data.endDate) : null;
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.paymentTerms !== undefined)
            updateData.payment_terms = data.paymentTerms;
        if (data.isActive !== undefined)
            updateData.is_active = data.isActive;
        // Si les lignes sont mises à jour, recalculer les totaux
        if (data.lines && data.lines.length > 0) {
            const totals = this.calculateTotals(data.lines, data.transportFees || 0, data.platformFees || 0);
            updateData.subtotal = totals.subtotal;
            updateData.tax_amount = totals.taxAmount;
            updateData.total_amount = totals.totalAmount;
        }
        // Mettre à jour dans une transaction
        await database_1.default.$transaction(async (tx) => {
            // Mettre à jour la facture récurrente
            await tx.recurring_invoices.update({
                where: { id: recurringInvoiceId },
                data: updateData,
            });
            // Si les lignes sont mises à jour, les remplacer
            if (data.lines && data.lines.length > 0) {
                // Supprimer les anciennes lignes
                await tx.recurring_invoice_lines.deleteMany({
                    where: { recurring_invoice_id: recurringInvoiceId },
                });
                // Créer les nouvelles lignes
                for (const lineData of data.lines) {
                    const lineSubtotal = lineData.quantity * lineData.unitPrice;
                    const lineTax = lineSubtotal * ((lineData.taxRate || 0) / 100);
                    const lineTotal = lineSubtotal + lineTax;
                    await tx.recurring_invoice_lines.create({
                        data: {
                            id: (0, uuid_1.v4)(),
                            recurring_invoice_id: recurringInvoiceId,
                            product_id: lineData.productId || null,
                            description: lineData.description || lineData.name,
                            quantity: new library_1.Decimal(lineData.quantity),
                            unit_price: new library_1.Decimal(lineData.unitPrice),
                            tax_rate: new library_1.Decimal(lineData.taxRate || 0),
                            tax_amount: new library_1.Decimal(lineTax),
                            subtotal: new library_1.Decimal(lineSubtotal),
                            total: new library_1.Decimal(lineTotal),
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }
            }
        });
        logger_1.default.info(`Recurring invoice updated: ${recurringInvoiceId}`, {
            companyId,
            recurringInvoiceId,
        });
        return this.getById(companyId, recurringInvoiceId);
    }
    /**
     * Supprimer (soft delete) une facture récurrente
     */
    async delete(companyId, recurringInvoiceId) {
        // Vérifier que la facture récurrente existe
        const existingRecurringInvoice = await database_1.default.recurring_invoices.findFirst({
            where: {
                id: recurringInvoiceId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingRecurringInvoice) {
            throw new error_middleware_1.CustomError('Recurring invoice not found', 404, 'RECURRING_INVOICE_NOT_FOUND');
        }
        // Soft delete
        await database_1.default.recurring_invoices.update({
            where: { id: recurringInvoiceId },
            data: { deleted_at: new Date(), updated_at: new Date() },
        });
        logger_1.default.info(`Recurring invoice deleted: ${recurringInvoiceId}`, {
            companyId,
            recurringInvoiceId,
        });
    }
    /**
     * Générer la prochaine facture depuis une facture récurrente
     */
    async generateNextInvoice(recurringInvoiceId) {
        const recurringInvoice = await database_1.default.recurring_invoices.findFirst({
            where: {
                id: recurringInvoiceId,
                deleted_at: null,
                is_active: true,
            },
            include: {
                recurring_invoice_lines: true,
                customers: true,
            },
        });
        if (!recurringInvoice) {
            throw new error_middleware_1.CustomError('Recurring invoice not found or inactive', 404, 'RECURRING_INVOICE_NOT_FOUND');
        }
        // Vérifier si on peut générer maintenant
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextRunDate = recurringInvoice.next_run_date ? new Date(recurringInvoice.next_run_date) : null;
        if (nextRunDate) {
            nextRunDate.setHours(0, 0, 0, 0);
            if (today < nextRunDate) {
                throw new error_middleware_1.CustomError(`Cannot generate invoice yet. Next run date is ${nextRunDate.toISOString().split('T')[0]}`, 400, 'TOO_EARLY');
            }
        }
        // Vérifier la date de fin
        if (recurringInvoice.end_date) {
            const endDate = new Date(recurringInvoice.end_date);
            endDate.setHours(0, 0, 0, 0);
            if (today > endDate) {
                throw new error_middleware_1.CustomError('Recurring invoice has ended', 400, 'RECURRING_INVOICE_ENDED');
            }
        }
        // Convertir les lignes de la facture récurrente en lignes de facture
        const invoiceLines = recurringInvoice.recurring_invoice_lines.map((line) => ({
            productId: line.product_id || undefined,
            name: line.description.split(' - ')[0] || line.description,
            description: line.description.includes(' - ') ? line.description.split(' - ').slice(1).join(' - ') : undefined,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unit_price),
            taxRate: Number(line.tax_rate),
        }));
        // Calculer la date d'échéance
        const dueDateDays = 30; // Par défaut
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + dueDateDays);
        // Créer la facture
        const invoice = await invoice_service_1.default.create(recurringInvoice.company_id, recurringInvoice.created_by || '', {
            customerId: recurringInvoice.customer_id,
            invoiceDate,
            dueDate,
            currency: recurringInvoice.currency || 'CDF',
            templateId: recurringInvoice.template_id || 'template-1-modern',
            notes: recurringInvoice.notes || undefined,
            paymentTerms: recurringInvoice.payment_terms || undefined,
            lines: invoiceLines,
            recurringInvoiceId: recurringInvoiceId,
        });
        // Calculer la prochaine date d'exécution
        const nextRunDateCalculated = this.calculateNextRunDate(recurringInvoice.start_date, recurringInvoice.frequency, 1, // interval par défaut
        invoiceDate);
        // Mettre à jour la facture récurrente
        await database_1.default.recurring_invoices.update({
            where: { id: recurringInvoiceId },
            data: {
                next_run_date: nextRunDateCalculated,
                last_run_date: invoiceDate,
                last_invoice_id: invoice.id,
                total_generated: {
                    increment: 1,
                },
                updated_at: new Date(),
            },
        });
        logger_1.default.info(`Invoice generated from recurring invoice: ${recurringInvoiceId} -> ${invoice.id}`, {
            recurringInvoiceId,
            invoiceId: invoice.id,
            nextRunDate: nextRunDateCalculated.toISOString(),
        });
        return invoice.id;
    }
    /**
     * Traiter toutes les factures récurrentes qui doivent être générées
     * Appelé par le scheduler quotidien
     */
    async processRecurringInvoices() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Récupérer toutes les factures récurrentes actives dont la date d'exécution est arrivée
        const recurringInvoices = await database_1.default.recurring_invoices.findMany({
            where: {
                is_active: true,
                deleted_at: null,
                next_run_date: {
                    lte: today,
                },
                OR: [
                    { end_date: null },
                    { end_date: { gte: today } },
                ],
            },
        });
        const results = [];
        for (const recurringInvoice of recurringInvoices) {
            try {
                const invoiceId = await this.generateNextInvoice(recurringInvoice.id);
                results.push({
                    recurringInvoiceId: recurringInvoice.id,
                    invoiceId,
                    success: true,
                });
            }
            catch (error) {
                logger_1.default.error(`Error generating invoice from recurring invoice ${recurringInvoice.id}`, {
                    recurringInvoiceId: recurringInvoice.id,
                    error: error.message,
                });
                results.push({
                    recurringInvoiceId: recurringInvoice.id,
                    invoiceId: null,
                    success: false,
                    error: error.message,
                });
            }
        }
        return results;
    }
    /**
     * Obtenir l'historique des factures générées depuis une facture récurrente
     */
    async getGenerationHistory(companyId, recurringInvoiceId) {
        // Vérifier que la facture récurrente existe
        const recurringInvoice = await database_1.default.recurring_invoices.findFirst({
            where: {
                id: recurringInvoiceId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!recurringInvoice) {
            throw new error_middleware_1.CustomError('Recurring invoice not found', 404, 'RECURRING_INVOICE_NOT_FOUND');
        }
        // Récupérer toutes les factures générées depuis cette facture récurrente
        const invoices = await database_1.default.invoices.findMany({
            where: {
                company_id: companyId,
                recurring_invoice_id: recurringInvoiceId,
                deleted_at: null,
            },
            include: {
                customers: {
                    select: {
                        id: true,
                        business_name: true,
                        first_name: true,
                        last_name: true,
                        type: true,
                    },
                },
            },
            orderBy: {
                invoice_date: 'desc',
            },
        });
        return invoices;
    }
}
exports.RecurringInvoiceService = RecurringInvoiceService;
exports.default = new RecurringInvoiceService();
//# sourceMappingURL=recurringInvoice.service.js.map