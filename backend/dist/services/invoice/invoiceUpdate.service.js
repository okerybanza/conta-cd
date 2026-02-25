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
exports.InvoiceUpdateService = void 0;
const error_middleware_1 = require("../../middleware/error.middleware");
const invoiceHelper_service_1 = __importDefault(require("./invoiceHelper.service"));
const invoiceCore_service_1 = __importDefault(require("./invoiceCore.service"));
class InvoiceUpdateService {
    /**
     * Mettre à jour une facture
     */
    async update(companyId, invoiceId, data, userId) {
        const existingInvoice = await invoiceCore_service_1.default.getById(companyId, invoiceId);
        // Seules les factures en brouillon peuvent être modifiées en profondeur
        if (existingInvoice.status !== 'draft' && data.lines) {
            throw new error_middleware_1.CustomError('Only draft invoices can have their lines modified', 400, 'UPDATE_RESTRICTED');
        }
        const updateData = {};
        if (data.reason)
            updateData.reason = data.reason;
        // Si les lignes sont modifiées, recalculer les totaux
        if (data.lines) {
            const totals = invoiceHelper_service_1.default.calculateTotals(data.lines);
            updateData.subtotal = totals.subtotal;
            updateData.tax_amount = totals.taxAmount;
            updateData.total_amount = totals.totalAmount;
        }
        // SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../../events/event-bus')));
        const { InvoiceUpdated } = await Promise.resolve().then(() => __importStar(require('../../events/domain-event')));
        const event = new InvoiceUpdated({
            companyId,
            userId,
            timestamp: new Date(),
        }, invoiceId, updateData, data.lines);
        await eventBus.publish(event);
        return invoiceCore_service_1.default.getById(companyId, invoiceId);
    }
}
exports.InvoiceUpdateService = InvoiceUpdateService;
exports.default = new InvoiceUpdateService();
//# sourceMappingURL=invoiceUpdate.service.js.map