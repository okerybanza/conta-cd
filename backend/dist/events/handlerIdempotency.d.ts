/**
 * ARCH-002: Idempotence des handlers d'événements
 * Permet de ne traiter qu'une seule fois un événement par handler (replay / double livraison safe).
 */
declare const HANDLER_NAMES: {
    readonly INVOICE_UPDATED: "handleInvoiceUpdated";
    readonly INVOICE_DELETED: "handleInvoiceDeleted";
    readonly INVOICE_STATUS_CHANGED: "invoiceStatusChangedHandler";
};
export { HANDLER_NAMES };
/**
 * Retourne true si l'événement a déjà été traité par ce handler.
 */
export declare function wasProcessed(eventId: string, handlerName: string): Promise<boolean>;
/**
 * Marque l'événement comme traité par ce handler (à appeler après succès du traitement).
 */
export declare function markProcessed(eventId: string, handlerName: string): Promise<void>;
//# sourceMappingURL=handlerIdempotency.d.ts.map