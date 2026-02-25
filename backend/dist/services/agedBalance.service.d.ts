export type AgedBalanceType = 'receivables' | 'payables';
export interface AgedBalanceItem {
    id: string;
    number: string;
    customerId?: string;
    customerName?: string;
    supplierId?: string;
    supplierName?: string;
    date: Date;
    dueDate: Date;
    amount: number;
    daysOverdue: number;
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
}
export interface AgedBalanceReport {
    type: AgedBalanceType;
    asOfDate: Date;
    items: AgedBalanceItem[];
    totals: {
        current: number;
        days1_30: number;
        days31_60: number;
        days61_90: number;
        daysOver90: number;
        total: number;
    };
    summary: {
        totalItems: number;
        totalAmount: number;
        averageDaysOverdue: number;
        itemsOver90Days: number;
        amountOver90Days: number;
    };
}
export declare class AgedBalanceService {
    /**
     * Calculer le nombre de jours de retard
     */
    private getDaysOverdue;
    /**
     * Répartir un montant dans les tranches d'âge
     */
    private distributeAmountByAge;
    /**
     * Générer la Balance Âgée des Créances Clients
     */
    generateAgedReceivables(companyId: string, asOfDate?: Date): Promise<AgedBalanceReport>;
    /**
     * Générer la Balance Âgée des Dettes Fournisseurs
     */
    generateAgedPayables(companyId: string, asOfDate?: Date): Promise<AgedBalanceReport>;
    /**
     * Générer la Balance Âgée (créances ou dettes)
     */
    generateAgedBalance(companyId: string, type: AgedBalanceType, asOfDate?: Date): Promise<AgedBalanceReport>;
}
declare const _default: AgedBalanceService;
export default _default;
//# sourceMappingURL=agedBalance.service.d.ts.map