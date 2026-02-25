"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceAccountingService = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const quota_service_1 = require("../quota.service");
const journalEntry_service_1 = __importDefault(require("../journalEntry.service"));
class InvoiceAccountingService {
    /**
     * Créer l'écriture comptable pour une facture
     */
    async createJournalEntryForInvoice(companyId, invoice, userId) {
        try {
            const quotaService = new quota_service_1.QuotaService();
            const hasAccounting = await quotaService.checkFeature(companyId, 'accounting');
            if (!hasAccounting)
                return;
            // Extract details for accounting
            const invoiceData = {
                invoiceNumber: invoice.invoice_number,
                invoiceDate: invoice.invoice_date,
                customerId: invoice.customer_id,
                customerName: invoice.customers?.business_name ||
                    `${invoice.customers?.first_name || ''} ${invoice.customers?.last_name || ''}`.trim(),
                amountHt: Number(invoice.subtotal),
                taxAmount: Number(invoice.tax_amount),
                amountTtc: Number(invoice.total_amount),
                currency: invoice.currency || 'CDF',
                createdBy: userId,
            };
            await journalEntry_service_1.default.ensureForInvoice(companyId, invoice.id, invoiceData);
            logger_1.default.info(`Journal entry ensured for invoice: ${invoice.id}`, {
                companyId,
                invoiceId: invoice.id
            });
        }
        catch (error) {
            logger_1.default.error('Error creating journal entry for invoice', {
                invoiceId: invoice.id,
                error: error.message
            });
            // Accounting failures shouldn't necessarily block everything, but should be logged
        }
    }
}
exports.InvoiceAccountingService = InvoiceAccountingService;
exports.default = new InvoiceAccountingService();
//# sourceMappingURL=invoiceAccounting.service.js.map