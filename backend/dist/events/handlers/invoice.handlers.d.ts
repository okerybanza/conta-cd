/**
 * Handlers pour les événements Facturation
 *
 * Ces handlers génèrent les mouvements de stock et écritures comptables
 */
import { InvoiceValidated, InvoiceCancelled } from '../domain-event';
/**
 * Handler pour InvoiceValidated
 * Crée les mouvements de stock pour chaque ligne de facture
 */
/**
 * Handler pour InvoiceValidated
 * Crée les mouvements de stock pour chaque ligne de facture via StockMovementService
 */
export declare function handleInvoiceValidated(event: InvoiceValidated): Promise<void>;
/**
 * Handler pour InvoiceCancelled
 * Inverse les mouvements de stock via StockMovementService
 */
export declare function handleInvoiceCancelled(event: InvoiceCancelled): Promise<void>;
//# sourceMappingURL=invoice.handlers.d.ts.map