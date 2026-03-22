"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const invoice_service_1 = __importDefault(require("./invoice.service"));
const crypto_1 = require("crypto");
class QuotationService {
    // Générer le numéro de devis
    async generateQuotationNumber(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { quotation_prefix: true, next_quotation_number: true },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        const prefix = company.quotation_prefix || 'DEV';
        const nextNumber = company.next_quotation_number || 1;
        const quotationNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;
        // Incrémenter le numéro suivant
        await database_1.default.companies.update({
            where: { id: companyId },
            data: { next_quotation_number: nextNumber + 1 },
        });
        return quotationNumber;
    }
    // Calculer les totaux d'un devis
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
    // Créer un devis
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
            throw new error_middleware_1.CustomError('Quotation must have at least one line', 400, 'VALIDATION_ERROR');
        }
        // Générer le numéro de devis
        const quotationNumber = await this.generateQuotationNumber(companyId);
        // Calculer les totaux
        const totals = this.calculateTotals(data.lines, data.transportFees || 0, data.platformFees || 0);
        // Créer le devis avec les lignes dans une transaction
        const quotation = await database_1.default.$transaction(async (tx) => {
            // Créer le devis
            const quotation = await tx.quotations.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: companyId,
                    customer_id: data.customerId,
                    quotation_number: quotationNumber,
                    quotation_date: data.quotationDate || new Date(),
                    expiration_date: data.expirationDate ? new Date(data.expirationDate) : null,
                    reference: data.reference,
                    po_number: data.poNumber,
                    shipping_address: data.shippingAddress,
                    shipping_city: data.shippingCity,
                    shipping_country: data.shippingCountry,
                    subtotal: totals.subtotal,
                    tax_amount: totals.taxAmount,
                    total_amount: totals.totalAmount,
                    transport_fees: new library_1.Decimal(data.transportFees || 0),
                    platform_fees: new library_1.Decimal(data.platformFees || 0),
                    currency: data.currency || 'CDF',
                    template_id: data.templateId || 'template-1-modern',
                    notes: data.notes,
                    payment_terms: data.paymentTerms,
                    footer_text: data.footerText,
                    status: 'draft',
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
                const description = lineData.description && lineData.description.trim().length > 0
                    ? `${lineData.name} - ${lineData.description}`
                    : lineData.name;
                await tx.quotation_lines.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
                        quotation_id: quotation.id,
                        product_id: lineData.productId || null,
                        description,
                        quantity: new library_1.Decimal(lineData.quantity),
                        unit_price: new library_1.Decimal(lineData.unitPrice),
                        tax_rate: lineData.taxRate ? new library_1.Decimal(lineData.taxRate) : new library_1.Decimal(0),
                        tax_amount: new library_1.Decimal(lineTax),
                        subtotal: new library_1.Decimal(lineSubtotal),
                        total: new library_1.Decimal(lineTotal),
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }
            return quotation;
        });
        // Récupérer le devis complet avec relations
        const fullQuotation = await this.getById(companyId, quotation.id);
        logger_1.default.info(`Quotation created: ${quotation.id}`, {
            companyId,
            quotationId: quotation.id,
            quotationNumber,
            customerId: data.customerId,
        });
        return fullQuotation;
    }
    // Obtenir un devis par ID
    async getById(companyId, quotationId) {
        const quotation = await database_1.default.quotations.findFirst({
            where: {
                id: quotationId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                customers: true,
                quotation_lines: true,
                invoices: {
                    select: {
                        id: true,
                        invoice_number: true,
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
        if (!quotation) {
            throw new error_middleware_1.CustomError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
        }
        return quotation;
    }
    // Lister les devis
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters.customerId) {
            where.customer_id = filters.customerId;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { quotation_number: { contains: filters.search, mode: 'insensitive' } },
                { reference: { contains: filters.search, mode: 'insensitive' } },
                { customers: { business_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { first_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { last_name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        if (filters.startDate || filters.endDate) {
            where.quotation_date = {};
            if (filters.startDate) {
                where.quotation_date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.quotation_date.lte = endDate;
            }
        }
        const [quotations, total] = await Promise.all([
            database_1.default.quotations.findMany({
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
                orderBy: { quotation_date: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.quotations.count({ where }),
        ]);
        return {
            data: quotations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Mettre à jour un devis
    async update(companyId, quotationId, userId, data) {
        const existingQuotation = await database_1.default.quotations.findFirst({
            where: {
                id: quotationId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!existingQuotation) {
            throw new error_middleware_1.CustomError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
        }
        // Ne pas permettre de modifier un devis accepté ou converti en facture
        if (existingQuotation.status === 'accepted' || existingQuotation.invoice_id) {
            throw new error_middleware_1.CustomError('Cannot update quotation that has been accepted or converted to invoice', 400, 'QUOTATION_LOCKED');
        }
        const updateData = {
            updated_at: new Date(),
        };
        if (data.customerId) {
            updateData.customer_id = data.customerId;
        }
        if (data.quotationDate) {
            updateData.quotation_date = new Date(data.quotationDate);
        }
        if (data.expirationDate !== undefined) {
            updateData.expiration_date = data.expirationDate ? new Date(data.expirationDate) : null;
        }
        if (data.status) {
            updateData.status = data.status;
            // Gérer les timestamps selon le statut
            if (data.status === 'sent' && !existingQuotation.sent_at) {
                updateData.sent_at = new Date();
            }
            if (data.status === 'accepted') {
                updateData.accepted_at = new Date();
            }
            if (data.status === 'rejected') {
                updateData.rejected_at = new Date();
            }
            if (data.status === 'expired') {
                updateData.expired_at = new Date();
            }
        }
        if (data.reference !== undefined)
            updateData.reference = data.reference;
        if (data.poNumber !== undefined)
            updateData.po_number = data.poNumber;
        if (data.shippingAddress !== undefined)
            updateData.shipping_address = data.shippingAddress;
        if (data.shippingCity !== undefined)
            updateData.shipping_city = data.shippingCity;
        if (data.shippingCountry !== undefined)
            updateData.shipping_country = data.shippingCountry;
        if (data.currency !== undefined)
            updateData.currency = data.currency;
        if (data.templateId !== undefined)
            updateData.template_id = data.templateId;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.paymentTerms !== undefined)
            updateData.payment_terms = data.paymentTerms;
        if (data.footerText !== undefined)
            updateData.footer_text = data.footerText;
        if (data.transportFees !== undefined)
            updateData.transport_fees = new library_1.Decimal(data.transportFees);
        if (data.platformFees !== undefined)
            updateData.platform_fees = new library_1.Decimal(data.platformFees);
        // Si les lignes sont modifiées, recalculer les totaux
        let totals = null;
        if (data.lines && data.lines.length > 0) {
            totals = this.calculateTotals(data.lines, data.transportFees !== undefined ? data.transportFees : Number(existingQuotation.transport_fees || 0), data.platformFees !== undefined ? data.platformFees : Number(existingQuotation.platform_fees || 0));
            updateData.subtotal = totals.subtotal;
            updateData.tax_amount = totals.taxAmount;
            updateData.total_amount = totals.totalAmount;
        }
        const updatedQuotation = await database_1.default.$transaction(async (tx) => {
            // Mettre à jour le devis
            const quotation = await tx.quotations.update({
                where: { id: quotationId },
                data: updateData,
            });
            // Si les lignes sont modifiées, supprimer les anciennes et créer les nouvelles
            if (data.lines && data.lines.length > 0) {
                await tx.quotation_lines.deleteMany({
                    where: { quotation_id: quotationId },
                });
                for (const lineData of data.lines) {
                    const lineSubtotal = lineData.quantity * lineData.unitPrice;
                    const lineTax = lineSubtotal * ((lineData.taxRate || 0) / 100);
                    const lineTotal = lineSubtotal + lineTax;
                    const description = lineData.description && lineData.description.trim().length > 0
                        ? `${lineData.name} - ${lineData.description}`
                        : lineData.name;
                    await tx.quotation_lines.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
                            quotation_id: quotationId,
                            product_id: lineData.productId || null,
                            description,
                            quantity: new library_1.Decimal(lineData.quantity),
                            unit_price: new library_1.Decimal(lineData.unitPrice),
                            tax_rate: lineData.taxRate ? new library_1.Decimal(lineData.taxRate) : new library_1.Decimal(0),
                            tax_amount: new library_1.Decimal(lineTax),
                            subtotal: new library_1.Decimal(lineSubtotal),
                            total: new library_1.Decimal(lineTotal),
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }
            }
            return quotation;
        });
        // Récupérer le devis complet
        const fullQuotation = await this.getById(companyId, quotationId);
        logger_1.default.info(`Quotation updated: ${quotationId}`, {
            companyId,
            quotationId,
        });
        return fullQuotation;
    }
    // Supprimer un devis
    async delete(companyId, quotationId) {
        const quotation = await database_1.default.quotations.findFirst({
            where: {
                id: quotationId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!quotation) {
            throw new error_middleware_1.CustomError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
        }
        // Ne pas permettre de supprimer un devis converti en facture
        if (quotation.invoice_id) {
            throw new error_middleware_1.CustomError('Cannot delete quotation that has been converted to invoice', 400, 'QUOTATION_CONVERTED');
        }
        await database_1.default.quotations.update({
            where: { id: quotationId },
            data: { deleted_at: new Date() },
        });
        logger_1.default.info(`Quotation deleted: ${quotationId}`, {
            companyId,
            quotationId,
        });
    }
    // Convertir un devis en facture
    async convertToInvoice(companyId, quotationId, userId) {
        const quotation = await this.getById(companyId, quotationId);
        if (quotation.status !== 'accepted') {
            throw new error_middleware_1.CustomError('Only accepted quotations can be converted to invoices', 400, 'QUOTATION_NOT_ACCEPTED');
        }
        if (quotation.invoice_id) {
            throw new error_middleware_1.CustomError('Quotation has already been converted to invoice', 400, 'QUOTATION_ALREADY_CONVERTED');
        }
        // Convertir les lignes du devis en lignes de facture
        const invoiceLines = quotation.quotation_lines.map((line) => ({
            productId: line.product_id || undefined,
            name: line.description.split(' - ')[0] || line.description,
            description: line.description.includes(' - ') ? line.description.split(' - ').slice(1).join(' - ') : undefined,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unit_price),
            taxRate: Number(line.tax_rate),
        }));
        // Créer la facture depuis le devis
        // La référence de la facture = numéro du devis (pour traçabilité)
        const invoice = await invoice_service_1.default.create(companyId, userId, {
            customerId: quotation.customer_id,
            invoiceDate: new Date(),
            dueDate: quotation.expiration_date || new Date(),
            reference: quotation.quotation_number, // Référence automatique = numéro du devis
            poNumber: quotation.po_number || undefined,
            shippingAddress: quotation.shipping_address || undefined,
            shippingCity: quotation.shipping_city || undefined,
            shippingCountry: quotation.shipping_country || undefined,
            transportFees: Number(quotation.transport_fees || 0),
            platformFees: Number(quotation.platform_fees || 0),
            currency: quotation.currency || 'CDF',
            templateId: quotation.template_id || 'template-1-modern',
            notes: quotation.notes || undefined,
            paymentTerms: quotation.payment_terms || undefined,
            footerText: quotation.footer_text || undefined,
            lines: invoiceLines,
        });
        // Lier la facture au devis
        await database_1.default.quotations.update({
            where: { id: quotationId },
            data: {
                invoice_id: invoice.id,
                status: 'accepted',
                accepted_at: new Date(),
            },
        });
        logger_1.default.info(`Quotation converted to invoice: ${quotationId} -> ${invoice.id}`, {
            companyId,
            quotationId,
            invoiceId: invoice.id,
        });
        // Récupérer le devis mis à jour
        const updatedQuotation = await this.getById(companyId, quotationId);
        return {
            quotation: updatedQuotation,
            invoice,
        };
    }
    // Vérifier et marquer les devis expirés
    async checkExpiredQuotations(companyId) {
        const where = {
            status: { in: ['draft', 'sent'] },
            expiration_date: { lte: new Date() },
            expired_at: null,
            deleted_at: null,
        };
        if (companyId) {
            where.company_id = companyId;
        }
        const expiredQuotations = await database_1.default.quotations.findMany({
            where,
            select: { id: true },
        });
        if (expiredQuotations.length > 0) {
            await database_1.default.quotations.updateMany({
                where: {
                    id: { in: expiredQuotations.map((q) => q.id) },
                },
                data: {
                    status: 'expired',
                    expired_at: new Date(),
                },
            });
            logger_1.default.info(`Marked ${expiredQuotations.length} quotations as expired`, {
                count: expiredQuotations.length,
                companyId,
            });
        }
        return expiredQuotations.length;
    }
}
exports.QuotationService = QuotationService;
exports.default = new QuotationService();
//# sourceMappingURL=quotation.service.js.map