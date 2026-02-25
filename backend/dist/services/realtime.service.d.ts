/**
 * Service pour les mises à jour en temps réel
 * Utilise Server-Sent Events (SSE) pour notifier les clients
 */
import { EventEmitter } from 'events';
export interface RealtimeEvent {
    type: 'dashboard_stats' | 'invoice_created' | 'invoice_updated' | 'invoice_status_changed' | 'payment_created' | 'expense_created' | 'expense_updated';
    companyId: string;
    data: any;
    timestamp: Date;
}
declare class RealtimeService extends EventEmitter {
    private clients;
    /**
     * Enregistrer un client SSE
     */
    registerClient(sessionId: string, companyId: string, res: any): void;
    /**
     * Désenregistrer un client
     */
    unregisterClient(sessionId: string, client: {
        companyId: string;
        res: any;
    }): void;
    /**
     * Envoyer un événement à un client spécifique
     */
    private sendToClient;
    /**
     * Émettre un événement à tous les clients d'une entreprise
     */
    emitToCompany(companyId: string, event: RealtimeEvent): void;
    /**
     * Émettre un événement de mise à jour des stats du dashboard
     */
    emitDashboardStatsUpdate(companyId: string, stats: any): void;
    /**
     * Émettre un événement de création de facture
     */
    emitInvoiceCreated(companyId: string, invoice: any): void;
    /**
     * Émettre un événement de mise à jour de facture
     */
    emitInvoiceUpdated(companyId: string, invoice: any): void;
    /**
     * Émettre un événement de changement de statut de facture
     */
    emitInvoiceStatusChanged(companyId: string, invoiceId: string, oldStatus: string, newStatus: string): void;
    /**
     * Émettre un événement de création de paiement
     */
    emitPaymentCreated(companyId: string, payment: any): void;
    /**
     * Émettre un événement de création de dépense
     */
    emitExpenseCreated(companyId: string, expense: any): void;
    /**
     * Émettre un événement de mise à jour de dépense
     */
    emitExpenseUpdated(companyId: string, expense: any): void;
    /**
     * Obtenir le nombre de clients connectés
     */
    getConnectedClientsCount(): number;
}
declare const _default: RealtimeService;
export default _default;
//# sourceMappingURL=realtime.service.d.ts.map