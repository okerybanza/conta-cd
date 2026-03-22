"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryAutomationService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const account_service_1 = __importDefault(require("../account.service"));
const journalEntryCore_service_1 = __importDefault(require("./journalEntryCore.service"));
const journalEntryHelper_service_1 = __importDefault(require("./journalEntryHelper.service"));
const journalEntryWorkflow_service_1 = __importDefault(require("./journalEntryWorkflow.service"));
class JournalEntryAutomationService {
    /**
     * Créer une écriture automatique pour une facture (vente)
     */
    async createForInvoice(companyId, invoiceId, invoiceData) {
        const clientAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_client_account_code', '411');
        const venteAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_revenue_account_code', '701');
        const tvaAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_vat_collected_account_code', '445710');
        const lines = [
            {
                accountId: clientAccount.id,
                description: `Facture ${invoiceData.invoiceNumber} - ${invoiceData.customerName}`,
                debit: invoiceData.amountTtc,
                credit: 0,
                currency: invoiceData.currency,
            },
            {
                accountId: venteAccount.id,
                description: `Vente - Facture ${invoiceData.invoiceNumber}`,
                debit: 0,
                credit: invoiceData.amountHt,
                currency: invoiceData.currency,
            },
        ];
        if (invoiceData.taxAmount > 0) {
            lines.push({
                accountId: tvaAccount.id,
                description: `TVA - Facture ${invoiceData.invoiceNumber}`,
                debit: 0,
                credit: invoiceData.taxAmount,
                currency: invoiceData.currency,
            });
        }
        return journalEntryCore_service_1.default.create(companyId, {
            entryDate: invoiceData.invoiceDate,
            description: `Écriture automatique - Facture ${invoiceData.invoiceNumber}`,
            sourceType: 'invoice',
            sourceId: invoiceId,
            lines,
            createdBy: invoiceData.createdBy,
        });
    }
    /**
     * S'assurer qu'il existe une écriture pour une facture (idempotent)
     */
    async ensureForInvoice(companyId, invoiceId, invoiceData) {
        const existing = await database_1.default.journal_entries.findFirst({
            where: { company_id: companyId, source_type: 'invoice', source_id: invoiceId, status: { not: 'reversed' } },
        });
        if (existing) {
            if (existing.status === 'draft') {
                await journalEntryCore_service_1.default.delete(companyId, existing.id);
                return this.createForInvoice(companyId, invoiceId, invoiceData);
            }
            return existing;
        }
        return this.createForInvoice(companyId, invoiceId, invoiceData);
    }
    /**
     * Créer une écriture automatique pour un avoir (credit note)
     */
    async createForCreditNote(companyId, creditNoteId, creditNoteData) {
        // Logic extracted from JournalEntryService.createForCreditNote
        const clientAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_client_account_code', '411');
        const venteAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_revenue_account_code', '701');
        const tvaAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'invoice_vat_collected_account_code', '445710');
        const lines = [
            {
                accountId: venteAccount.id,
                description: `Avoir ${creditNoteData.creditNoteNumber} - Annulation vente`,
                debit: creditNoteData.amountHt,
                credit: 0,
                currency: creditNoteData.currency,
            },
            {
                accountId: clientAccount.id,
                description: `Avoir ${creditNoteData.creditNoteNumber} - ${creditNoteData.customerName}`,
                debit: 0,
                credit: creditNoteData.amountTtc,
                currency: creditNoteData.currency,
            },
        ];
        if (creditNoteData.taxAmount > 0) {
            lines.splice(1, 0, {
                accountId: tvaAccount.id,
                description: `TVA - Avoir ${creditNoteData.creditNoteNumber}`,
                debit: creditNoteData.taxAmount,
                credit: 0,
                currency: creditNoteData.currency,
            });
        }
        return journalEntryCore_service_1.default.create(companyId, {
            entryDate: creditNoteData.creditNoteDate,
            description: `Écriture automatique - Avoir ${creditNoteData.creditNoteNumber}`,
            sourceType: 'credit_note',
            sourceId: creditNoteId,
            lines,
            createdBy: creditNoteData.createdBy,
        });
    }
    /**
     * S'assurer qu'il existe une écriture pour un avoir
     */
    async ensureForCreditNote(companyId, creditNoteId, creditNoteData) {
        const existing = await database_1.default.journal_entries.findFirst({
            where: { company_id: companyId, source_type: 'credit_note', source_id: creditNoteId, status: { not: 'reversed' } },
        });
        if (existing) {
            if (existing.status === 'draft') {
                await journalEntryCore_service_1.default.delete(companyId, existing.id);
                return this.createForCreditNote(companyId, creditNoteId, creditNoteData);
            }
            return existing;
        }
        return this.createForCreditNote(companyId, creditNoteId, creditNoteData);
    }
    /**
     * Créer une écriture automatique pour une dépense
     */
    async createForExpense(companyId, expenseId, expenseData) {
        // Logic extracted from JournalEntryService.createForExpense
        const defaultSupplierAccountCode = '401';
        const defaultChargeAccountCode = '601';
        const tvaDeductibleAccountCode = '445660';
        const fournisseurAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'expense_supplier_account_code', defaultSupplierAccountCode);
        const tvaAccount = await account_service_1.default.getByCode(companyId, tvaDeductibleAccountCode);
        let chargeAccount;
        if (expenseData.accountId) {
            chargeAccount = await database_1.default.accounts.findFirst({ where: { id: expenseData.accountId, company_id: companyId, is_active: true } });
        }
        if (!chargeAccount) {
            chargeAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'expense_charge_account_code', defaultChargeAccountCode);
        }
        const lines = [
            {
                accountId: chargeAccount.id,
                description: `Dépense ${expenseData.expenseNumber}${expenseData.supplierName ? ` - ${expenseData.supplierName}` : ''}`,
                debit: expenseData.amountHt,
                credit: 0,
                currency: expenseData.currency,
            },
        ];
        if (expenseData.taxAmount > 0) {
            lines.push({
                accountId: tvaAccount.id,
                description: `TVA déductible - Dépense ${expenseData.expenseNumber}`,
                debit: expenseData.taxAmount,
                credit: 0,
                currency: expenseData.currency,
            });
        }
        lines.push({
            accountId: fournisseurAccount.id,
            description: `Dépense ${expenseData.expenseNumber}${expenseData.supplierName ? ` - ${expenseData.supplierName}` : ''}`,
            debit: 0,
            credit: expenseData.amountTtc,
            currency: expenseData.currency,
        });
        return journalEntryCore_service_1.default.create(companyId, {
            entryDate: expenseData.expenseDate,
            description: `Écriture automatique - Dépense ${expenseData.expenseNumber}`,
            sourceType: 'expense',
            sourceId: expenseId,
            lines,
            createdBy: expenseData.createdBy,
        });
    }
    /**
     * S'assurer qu'il existe une écriture pour une dépense
     */
    async ensureForExpense(companyId, expenseId, expenseData) {
        const existing = await database_1.default.journal_entries.findFirst({
            where: { company_id: companyId, source_type: 'expense', source_id: expenseId, status: { not: 'reversed' } },
        });
        if (existing) {
            if (existing.status === 'draft') {
                await journalEntryCore_service_1.default.delete(companyId, existing.id);
                return this.createForExpense(companyId, expenseId, expenseData);
            }
            return existing;
        }
        return this.createForExpense(companyId, expenseId, expenseData);
    }
    /**
     * Créer une écriture automatique pour un paiement
     */
    async createForPayment(companyId, paymentId, paymentData) {
        let tresorerieAccountCode = '531';
        if (paymentData.paymentMethod === 'bank_transfer' || paymentData.paymentMethod === 'check') {
            tresorerieAccountCode = '512';
        }
        else if (paymentData.paymentMethod.includes('mobile_money')) {
            tresorerieAccountCode = '512';
        }
        const tresorerieAccount = await account_service_1.default.getByCode(companyId, tresorerieAccountCode);
        let otherAccount;
        if (paymentData.invoiceId) {
            otherAccount = await account_service_1.default.getByCode(companyId, '411');
        }
        else if (paymentData.expenseId) {
            otherAccount = await journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, 'expense_supplier_account_code', '401');
        }
        else {
            throw new error_middleware_1.CustomError('Payment must be linked to an invoice or expense', 400, 'INVALID_PAYMENT');
        }
        const lines = [
            {
                accountId: tresorerieAccount.id,
                description: `Paiement ${paymentData.paymentMethod}`,
                debit: paymentData.amount,
                credit: 0,
                currency: paymentData.currency,
            },
            {
                accountId: otherAccount.id,
                description: `Paiement ${paymentData.paymentMethod}`,
                debit: 0,
                credit: paymentData.amount,
                currency: paymentData.currency,
            },
        ];
        return journalEntryCore_service_1.default.create(companyId, {
            entryDate: paymentData.paymentDate,
            description: `Écriture automatique - Paiement`,
            sourceType: 'payment',
            sourceId: paymentId,
            lines,
            createdBy: paymentData.createdBy,
        });
    }
    /**
     * Supprimer les écritures liées à une facture
     */
    async deleteForInvoice(companyId, invoiceId) {
        // Logic extracted from JournalEntryService.deleteForInvoice
        const entries = await database_1.default.journal_entries.findMany({
            where: { company_id: companyId, source_type: 'invoice', source_id: invoiceId, status: 'draft' },
        });
        for (const entry of entries) {
            await journalEntryCore_service_1.default.delete(companyId, entry.id);
        }
        const postedEntries = await database_1.default.journal_entries.findMany({
            where: { company_id: companyId, source_type: 'invoice', source_id: invoiceId, status: 'posted', reversed_at: null },
            include: { journal_entry_lines: true },
        });
        for (const entry of postedEntries) {
            const { reversalEntry } = await journalEntryWorkflow_service_1.default.reverse(companyId, entry.id, entry.created_by, 'Facture annulée/réinitialisée');
            await journalEntryWorkflow_service_1.default.post(companyId, reversalEntry.id);
        }
    }
}
exports.JournalEntryAutomationService = JournalEntryAutomationService;
exports.default = new JournalEntryAutomationService();
//# sourceMappingURL=journalEntryAutomation.service.js.map