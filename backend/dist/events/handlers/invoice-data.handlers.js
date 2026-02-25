"use strict";
/**
 * InvoiceHandlers
 * Handles invoice data changes and deletion events
 * SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
 * ARCH-002: Idempotent — skip if event already processed by this handler
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInvoiceDeleted = exports.handleInvoiceUpdated = void 0;
const database_1 = __importDefault(require("../../config/database"));
const audit_service_1 = __importDefault(require("../../services/audit.service"));
const logger_1 = __importDefault(require("../../utils/logger"));
const handlerIdempotency_1 = require("../handlerIdempotency");
const handleInvoiceUpdated = async (event) => {
    if (await (0, handlerIdempotency_1.wasProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_UPDATED)) {
        logger_1.default.debug('InvoiceUpdated already processed (ARCH-002)', { eventId: event.id });
        return;
    }
    logger_1.default.info('Processing InvoiceUpdated event', {
        invoiceId: event.invoiceId,
        changes: JSON.stringify(event.changes),
        hasLines: !!event.lines
    });
    try {
        await database_1.default.$transaction(async (tx) => {
            // 1. Mettre à jour la facture
            const inv = await tx.invoices.update({
                where: { id: event.invoiceId },
                data: {
                    ...event.changes,
                    updated_at: event.occurredAt
                },
            });
            // 2. Si lignes fournies, remplacer les anciennes
            if (event.lines) {
                logger_1.default.debug('Replacing invoice lines', { count: event.lines.length });
                await tx.invoice_lines.deleteMany({ where: { invoice_id: event.invoiceId } });
                for (const line of event.lines) {
                    await tx.invoice_lines.create({
                        data: {
                            id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
                            invoice_id: event.invoiceId,
                            product_id: line.productId,
                            description: line.description || line.name,
                            quantity: line.quantity,
                            unit_price: line.unitPrice,
                            tax_rate: line.taxRate || 0,
                            subtotal: line.quantity * line.unitPrice,
                            total: (line.quantity * line.unitPrice) * (1 + (line.taxRate || 0) / 100),
                            updated_at: event.occurredAt
                        },
                    });
                }
            }
            // 3. Log audit
            await audit_service_1.default.createLog({
                companyId: event.metadata.companyId,
                userId: event.metadata.userId,
                action: 'INVOICE_UPDATED',
                entityType: 'invoice',
                entityId: event.invoiceId,
                module: 'facturation',
                afterState: { changes: event.changes, hasLines: !!event.lines },
                metadata: { eventId: event.id }
            });
        });
        await (0, handlerIdempotency_1.markProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_UPDATED);
        logger_1.default.info('Invoice data updated successfully via event', { invoiceId: event.invoiceId });
    }
    catch (error) {
        logger_1.default.error('Failed to handle InvoiceUpdated event', {
            invoiceId: event.invoiceId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
exports.handleInvoiceUpdated = handleInvoiceUpdated;
const handleInvoiceDeleted = async (event) => {
    if (await (0, handlerIdempotency_1.wasProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_DELETED)) {
        logger_1.default.debug('InvoiceDeleted already processed (ARCH-002)', { eventId: event.id });
        return;
    }
    logger_1.default.info('Processing InvoiceDeleted event', { invoiceId: event.invoiceId });
    try {
        await database_1.default.invoices.update({
            where: { id: event.invoiceId },
            data: {
                deleted_at: event.occurredAt,
                updated_at: event.occurredAt
            },
        });
        await audit_service_1.default.createLog({
            companyId: event.metadata.companyId,
            userId: event.metadata.userId,
            action: 'INVOICE_DELETED',
            entityType: 'invoice',
            entityId: event.invoiceId,
            module: 'facturation',
            afterState: { deleted_at: event.occurredAt },
            justification: event.reason,
            metadata: { eventId: event.id }
        });
        await (0, handlerIdempotency_1.markProcessed)(event.id, handlerIdempotency_1.HANDLER_NAMES.INVOICE_DELETED);
        logger_1.default.info('Invoice soft-deleted successfully via event', { invoiceId: event.invoiceId });
    }
    catch (error) {
        logger_1.default.error('Failed to handle InvoiceDeleted event', {
            invoiceId: event.invoiceId,
            error: error.message
        });
        throw error;
    }
};
exports.handleInvoiceDeleted = handleInvoiceDeleted;
//# sourceMappingURL=invoice-data.handlers.js.map