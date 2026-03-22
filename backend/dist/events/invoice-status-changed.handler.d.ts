/**
 * InvoiceStatusChangedHandler
 * SPRINT 1 - ARCH-007: Replace direct UPDATE with event-based pattern
 * ARCH-002: Idempotent — skip if event already processed
 */
import { InvoiceStatusChangedEvent } from './domain-event';
import { EventHandler } from './event-bus';
export declare const invoiceStatusChangedHandler: EventHandler<InvoiceStatusChangedEvent>;
//# sourceMappingURL=invoice-status-changed.handler.d.ts.map