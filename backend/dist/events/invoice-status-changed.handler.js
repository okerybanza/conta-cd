"use strict";
/**
 * InvoiceStatusChangedHandler
 * SPRINT 1 - ARCH-007: Replace direct UPDATE with event-based pattern
 * ARCH-002: Idempotent — skip if event already processed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceStatusChangedHandler = void 0;
const database_1 = __importDefault(require("../config/database"));
const audit_service_1 = __importDefault(require("../services/audit.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const handlerIdempotency_1 = require("./handlerIdempotency");
const invoiceStatusChangedHandler = async (event) => {
    if (await (0, handlerIdempotency_1.wasProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_STATUS_CHANGED)) {
        logger_1.default.debug('InvoiceStatusChanged already processed (ARCH-002)', { eventId: event.id });
        return;
    }
    logger_1.default.info('Processing InvoiceStatusChangedEvent', {
        invoiceId: event.invoiceId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
    });
    try {
        // Update invoice status
        const updateData = {
            status: event.newStatus,
            updated_at: event.occurredAt,
        };
        // Set sent_at when status changes to 'sent'
        if (event.newStatus === 'sent') {
            const currentInvoice = await database_1.default.invoices.findUnique({
                where: { id: event.invoiceId },
                select: { sent_at: true },
            });
            if (!currentInvoice?.sent_at) {
                updateData.sent_at = event.occurredAt;
            }
        }
        await database_1.default.invoices.update({
            where: { id: event.invoiceId },
            data: updateData,
        });
        // Log to audit trail
        await audit_service_1.default.createLog({
            companyId: event.metadata.companyId,
            userId: event.metadata.userId,
            action: 'INVOICE_STATUS_CHANGED',
            entityType: 'invoice',
            entityId: event.invoiceId,
            module: 'facturation',
            beforeState: { status: event.previousStatus },
            afterState: { status: event.newStatus },
            justification: event.reason,
            metadata: {
                previousStatus: event.previousStatus,
                newStatus: event.newStatus
            },
        });
        await (0, handlerIdempotency_1.markProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_STATUS_CHANGED);
        logger_1.default.info('Invoice status updated successfully', {
            invoiceId: event.invoiceId,
            newStatus: event.newStatus,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to handle InvoiceStatusChangedEvent', {
            eventId: event.id,
            invoiceId: event.invoiceId,
            error: error.message,
        });
        throw error;
    }
};
exports.invoiceStatusChangedHandler = invoiceStatusChangedHandler;
//# sourceMappingURL=invoice-status-changed.handler.js.map