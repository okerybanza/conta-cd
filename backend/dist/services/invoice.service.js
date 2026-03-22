"use strict";
// SPRINT 3 - TASK 3.1 (ARCH-004): InvoiceService Facade
// This service now delegates to specialized sub-services for better maintainability
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const invoiceCore_service_1 = __importDefault(require("./invoice/invoiceCore.service"));
const invoiceWorkflow_service_1 = __importDefault(require("./invoice/invoiceWorkflow.service"));
const invoiceAccounting_service_1 = __importDefault(require("./invoice/invoiceAccounting.service"));
const invoiceHelper_service_1 = __importDefault(require("./invoice/invoiceHelper.service"));
const invoiceCreation_service_1 = __importDefault(require("./invoice/invoiceCreation.service"));
const invoiceUpdate_service_1 = __importDefault(require("./invoice/invoiceUpdate.service"));
const invoiceDelete_service_1 = __importDefault(require("./invoice/invoiceDelete.service"));
class InvoiceService {
    // Delegate to Helper Service
    async generateInvoiceNumber(companyId) {
        return invoiceHelper_service_1.default.generateInvoiceNumber(companyId);
    }
    calculateTotals(lines, transportFees = 0, platformFees = 0) {
        return invoiceHelper_service_1.default.calculateTotals(lines, transportFees, platformFees);
    }
    async create(companyId, userId, data) {
        return invoiceCreation_service_1.default.create(companyId, userId, data);
    }
    // Delegate CRUD to Core Service
    async getInvoiceId(companyId, identifier) {
        return invoiceCore_service_1.default.getInvoiceId(companyId, identifier);
    }
    async getById(companyId, invoiceId) {
        return invoiceCore_service_1.default.getById(companyId, invoiceId);
    }
    async list(companyId, filters = {}) {
        return invoiceCore_service_1.default.list(companyId, filters);
    }
    // UpdateStatus delegates to Workflow Service
    async updateStatus(companyId, invoiceId, status, userId, justification) {
        return invoiceWorkflow_service_1.default.updateStatus(companyId, invoiceId, status, userId, justification);
    }
    // Accounting delegates to Accounting Service
    async createJournalEntryForInvoice(companyId, invoice, userId) {
        return invoiceAccounting_service_1.default.createJournalEntryForInvoice(companyId, invoice, userId);
    }
    async update(companyId, invoiceId, data, userId) {
        return invoiceUpdate_service_1.default.update(companyId, invoiceId, data, userId);
    }
    async delete(companyId, invoiceId, userId, justification) {
        return invoiceDelete_service_1.default.delete(companyId, invoiceId, userId, justification);
    }
    async duplicate(companyId, invoiceId, userId) {
        return invoiceCreation_service_1.default.duplicate(companyId, invoiceId, userId);
    }
}
exports.InvoiceService = InvoiceService;
exports.default = new InvoiceService();
//# sourceMappingURL=invoice.service.js.map