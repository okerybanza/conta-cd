export declare class ReminderService {
    /**
     * Traiter les rappels de paiement pour les factures en attente
     */
    processPaymentReminders(): Promise<({
        companyId: any;
        invoiceId: any;
        success: boolean;
        error?: undefined;
    } | {
        companyId: any;
        invoiceId: any;
        success: boolean;
        error: any;
    } | {
        companyId: any;
        success: boolean;
        error: any;
        invoiceId?: undefined;
    })[]>;
    /**
     * Obtenir les statistiques des rappels pour une entreprise
     */
    getReminderStats(companyId: string): Promise<{
        enabled: any;
        daysBefore: any;
        daysAfter: any;
        frequency: any;
        methods: any;
        preventiveCount: any;
        overdueCount: any;
        totalPending: any;
    }>;
}
declare const _default: ReminderService;
export default _default;
//# sourceMappingURL=reminder.service.d.ts.map