/**
 * InvoiceHandlers
 * Handles invoice data changes and deletion events
 * SPRINT 1 - TASK 1.1: Replace direct UPDATE with event-based pattern
 * ARCH-002: Idempotent — skip if event already processed by this handler
 */
import { InvoiceUpdated, InvoiceDeleted } from '../domain-event';
import { EventHandler } from '../event-bus';
export declare const handleInvoiceUpdated: EventHandler<InvoiceUpdated>;
export declare const handleInvoiceDeleted: EventHandler<InvoiceDeleted>;
//# sourceMappingURL=invoice-data.handlers.d.ts.map