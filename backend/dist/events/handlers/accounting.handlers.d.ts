/**
 * Handlers pour les événements Comptabilité
 *
 * Ces handlers génèrent les écritures comptables automatiques
 */
import { JournalEntryPosted, InvoiceValidated } from '../domain-event';
/**
 * Handler pour InvoiceValidated
 * Génère automatiquement les écritures comptables pour une facture validée
 */
export declare function handleInvoiceValidatedAccounting(event: InvoiceValidated): Promise<void>;
/**
 * Handler pour JournalEntryPosted
 * Met à jour les soldes des comptes (calculés à partir des écritures)
 */
export declare function handleJournalEntryPosted(event: JournalEntryPosted): Promise<void>;
//# sourceMappingURL=accounting.handlers.d.ts.map