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
exports.InvoiceCreationService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const quota_service_1 = require("../quota.service");
const fiscalPeriod_service_1 = __importDefault(require("../fiscalPeriod.service"));
const usage_service_1 = __importDefault(require("../usage.service"));
const invoiceHelper_service_1 = __importDefault(require("./invoiceHelper.service"));
const invoiceCore_service_1 = __importDefault(require("./invoiceCore.service"));
const invoiceAccounting_service_1 = __importDefault(require("./invoiceAccounting.service"));
class InvoiceCreationService {
    /**
     * Créer une facture
     */
    async create(companyId, userId, data) {
        // 1. Vérifier le quota
        const quotaService = new quota_service_1.QuotaService();
        await quotaService.checkLimit(companyId, 'invoices');
        // 2. Vérifier le client
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
        // 3. SPRINT 2 - TASK 2.4: Multi-Currency Support
        // Get company base currency
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { currency: true },
        });
        const baseCurrency = company?.currency || 'CDF';
        const invoiceCurrency = data.currency || baseCurrency;
        const invoiceDate = data.invoiceDate || new Date();
        // ACCT-008: Vérifier que la date de facture est dans une période ouverte
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, invoiceDate);
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError(periodValidation.message || 'La période fiscale pour cette date est verrouillée ou close.', 400, 'INVALID_PERIOD');
        }
        // Get exchange rate if currencies differ
        let exchangeRate = 1.0;
        if (invoiceCurrency !== baseCurrency) {
            const exchangeRateService = (await Promise.resolve().then(() => __importStar(require('../currency/exchangeRate.service')))).default;
            exchangeRate = await exchangeRateService.getRate(invoiceCurrency, baseCurrency, invoiceDate);
        }
        // 4. Préparer les données
        const invoiceNumber = await invoiceHelper_service_1.default.generateInvoiceNumber(companyId);
        const totals = invoiceHelper_service_1.default.calculateTotals(data.lines, data.transportFees, data.platformFees);
        // Calculate base currency amounts
        const baseTotals = {
            subtotal: totals.subtotal * exchangeRate,
            taxAmount: totals.taxAmount * exchangeRate,
            totalAmount: totals.totalAmount * exchangeRate,
        };
        const dueDate = data.dueDate || invoiceDate;
        // 5. Créer la facture et ses lignes dans une transaction
        const invoice = await database_1.default.$transaction(async (tx) => {
            const inv = await tx.invoices.create({
                data: {
                    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                    company_id: companyId,
                    customer_id: data.customerId,
                    invoice_number: invoiceNumber,
                    invoice_date: invoiceDate,
                    due_date: dueDate,
                    reference: data.reference,
                    po_number: data.poNumber,
                    shipping_address: data.shippingAddress,
                    shipping_city: data.shippingCity,
                    shipping_country: data.shippingCountry,
                    transport_fees: data.transportFees ?? 0,
                    platform_fees: data.platformFees ?? 0,
                    currency: invoiceCurrency,
                    base_currency: baseCurrency,
                    exchange_rate: exchangeRate,
                    template_id: data.templateId || 'template-1-modern',
                    notes: data.notes,
                    payment_terms: data.paymentTerms,
                    footer_text: data.footerText,
                    subtotal: totals.subtotal,
                    tax_amount: totals.taxAmount,
                    total_amount: totals.totalAmount,
                    base_subtotal: baseTotals.subtotal,
                    base_tax_amount: baseTotals.taxAmount,
                    base_total_amount: baseTotals.totalAmount,
                    created_by: userId,
                    recurring_invoice_id: data.recurringInvoiceId,
                    updated_at: new Date(),
                },
            });
            // Créer les lignes
            for (const line of data.lines) {
                await tx.invoice_lines.create({
                    data: {
                        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                        invoice_id: inv.id,
                        product_id: line.productId,
                        description: line.description || line.name,
                        quantity: line.quantity,
                        unit_price: line.unitPrice,
                        tax_rate: line.taxRate || 0,
                        subtotal: line.quantity * line.unitPrice,
                        total: (line.quantity * line.unitPrice) * (1 + (line.taxRate || 0) / 100),
                        updated_at: new Date(),
                    },
                });
            }
            return inv;
        });
        // 6. Automatisation comptable
        await invoiceAccounting_service_1.default.createJournalEntryForInvoice(companyId, invoice, userId);
        // 7. Mettre à jour l'usage (quotas factures / plan)
        await usage_service_1.default.increment(companyId, 'invoices');
        return invoiceCore_service_1.default.getById(companyId, invoice.id);
    }
    /**
     * Dupliquer une facture
     */
    async duplicate(companyId, invoiceId, userId) {
        const invoice = await invoiceCore_service_1.default.getById(companyId, invoiceId);
        const newInvoiceData = {
            customerId: invoice.customer_id,
            invoiceDate: new Date(),
            dueDate: invoice.due_date,
            reference: invoice.reference ? `Copy of ${invoice.reference}` : undefined,
            currency: invoice.currency || undefined,
            notes: invoice.notes || undefined,
            paymentTerms: invoice.payment_terms || undefined,
            lines: invoice.invoice_lines.map((line) => ({
                productId: line.product_id,
                name: line.name,
                description: line.description,
                quantity: Number(line.quantity),
                unitPrice: Number(line.unit_price),
                taxRate: Number(line.tax_rate),
            })),
        };
        return this.create(companyId, userId, newInvoiceData);
    }
}
exports.InvoiceCreationService = InvoiceCreationService;
exports.default = new InvoiceCreationService();
//# sourceMappingURL=invoiceCreation.service.js.map