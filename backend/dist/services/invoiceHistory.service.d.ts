import { InvoiceStatus } from './invoiceValidation.service';
/**
 * Service pour gérer l'historique des changements de factures
 * Pour l'instant, on utilise les logs structurés
 * Plus tard, on pourra ajouter une table InvoiceHistory dans Prisma
 */
export declare class InvoiceHistoryService {
    /**
     * Enregistrer un changement de statut
     */
    static logStatusChange(companyId: string, invoiceId: string, oldStatus: InvoiceStatus, newStatus: InvoiceStatus, userId?: string, reason?: string): Promise<void>;
    /**
     * Enregistrer une modification de facture
     */
    static logModification(companyId: string, invoiceId: string, field: string, oldValue: any, newValue: any, userId?: string): Promise<void>;
    /**
     * Récupérer l'historique d'une facture (pour l'instant, via les logs)
     * Plus tard, on pourra interroger la table InvoiceHistory
     */
    static getHistory(companyId: string, invoiceId: string): Promise<Array<{
        field: string;
        oldValue: any;
        newValue: any;
        changedBy?: string;
        timestamp: string;
    }>>;
}
export default InvoiceHistoryService;
//# sourceMappingURL=invoiceHistory.service.d.ts.map