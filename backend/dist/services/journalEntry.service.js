"use strict";
// SPRINT 3 - TASK 3.1 (ARCH-004): JournalEntryService Facade
// This service now delegates to specialized sub-services for better maintainability
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryService = void 0;
const journalEntryCore_service_1 = __importDefault(require("./journalEntry/journalEntryCore.service"));
const journalEntryWorkflow_service_1 = __importDefault(require("./journalEntry/journalEntryWorkflow.service"));
const journalEntryAutomation_service_1 = __importDefault(require("./journalEntry/journalEntryAutomation.service"));
const journalEntryHelper_service_1 = __importDefault(require("./journalEntry/journalEntryHelper.service"));
class JournalEntryService {
    // Delegate Helper Methods (private but kept for internal facade compatibility)
    async getAccountBySettingOrCode(companyId, settingKey, defaultCode) {
        return journalEntryHelper_service_1.default.getAccountBySettingOrCode(companyId, settingKey, defaultCode);
    }
    async generateEntryNumber(companyId) {
        return journalEntryHelper_service_1.default.generateEntryNumber(companyId);
    }
    validateBalance(lines) {
        return journalEntryHelper_service_1.default.validateBalance(lines);
    }
    // Core CRUD Operations
    async create(companyId, data) {
        return journalEntryCore_service_1.default.create(companyId, data);
    }
    async getById(companyId, entryId) {
        return journalEntryCore_service_1.default.getById(companyId, entryId);
    }
    async list(companyId, filters = {}) {
        return journalEntryCore_service_1.default.list(companyId, filters);
    }
    async update(companyId, entryId, data) {
        return journalEntryCore_service_1.default.update(companyId, entryId, data);
    }
    async delete(companyId, entryId) {
        return journalEntryCore_service_1.default.delete(companyId, entryId);
    }
    // Workflow Operations
    async post(companyId, entryId, userId) {
        return journalEntryWorkflow_service_1.default.post(companyId, entryId, userId);
    }
    async reverse(companyId, entryId, userId, reason) {
        return journalEntryWorkflow_service_1.default.reverse(companyId, entryId, userId, reason);
    }
    // Automation Operations
    async createForInvoice(companyId, invoiceId, invoiceData) {
        return journalEntryAutomation_service_1.default.createForInvoice(companyId, invoiceId, invoiceData);
    }
    async createForCreditNote(companyId, creditNoteId, creditNoteData) {
        return journalEntryAutomation_service_1.default.createForCreditNote(companyId, creditNoteId, creditNoteData);
    }
    async ensureForCreditNote(companyId, creditNoteId, creditNoteData) {
        return journalEntryAutomation_service_1.default.ensureForCreditNote(companyId, creditNoteId, creditNoteData);
    }
    async ensureForInvoice(companyId, invoiceId, invoiceData) {
        return journalEntryAutomation_service_1.default.ensureForInvoice(companyId, invoiceId, invoiceData);
    }
    async createForExpense(companyId, expenseId, expenseData) {
        return journalEntryAutomation_service_1.default.createForExpense(companyId, expenseId, expenseData);
    }
    async ensureForExpense(companyId, expenseId, expenseData) {
        return journalEntryAutomation_service_1.default.ensureForExpense(companyId, expenseId, expenseData);
    }
    async deleteForInvoice(companyId, invoiceId) {
        return journalEntryAutomation_service_1.default.deleteForInvoice(companyId, invoiceId);
    }
    async createForPayment(companyId, paymentId, paymentData) {
        return journalEntryAutomation_service_1.default.createForPayment(companyId, paymentId, paymentData);
    }
}
exports.JournalEntryService = JournalEntryService;
exports.default = new JournalEntryService();
//# sourceMappingURL=journalEntry.service.js.map