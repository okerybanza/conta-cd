export interface VATReportFilters {
    startDate?: Date | string;
    endDate?: Date | string;
    period?: 'month' | 'quarter' | 'year';
}
export interface VATReportItem {
    date: Date;
    documentNumber: string;
    documentType: 'invoice' | 'expense';
    customerName?: string;
    supplierName?: string;
    amountHt: number;
    taxRate: number;
    vatAmount: number;
    currency: string;
}
export interface VATReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    collected: {
        items: VATReportItem[];
        total: number;
        byRate: Array<{
            rate: number;
            amount: number;
            count: number;
        }>;
    };
    deductible: {
        items: VATReportItem[];
        total: number;
        byRate: Array<{
            rate: number;
            amount: number;
            count: number;
        }>;
    };
    summary: {
        totalCollected: number;
        totalDeductible: number;
        vatToPay: number;
        netVAT: number;
    };
}
export interface VATDeclaration {
    period: string;
    vatCollected: number;
    vatDeductible: number;
    vatToPay: number;
    status: 'draft' | 'submitted' | 'paid';
    submittedAt?: Date;
    paidAt?: Date;
}
export declare class TVAService {
    /**
     * Obtenir les dates de période
     */
    private getPeriodDates;
    /**
     * Calculer la TVA collectée (sur factures)
     * TVA collectée = TVA sur les ventes (compte 445710)
     */
    calculateVATCollected(companyId: string, filters?: VATReportFilters): Promise<number>;
    /**
     * Calculer la TVA déductible (sur dépenses)
     * TVA déductible = TVA sur les achats (compte 445660)
     */
    calculateVATDeductible(companyId: string, filters?: VATReportFilters): Promise<number>;
    /**
     * Calculer la TVA à payer
     * TVA à payer = TVA collectée - TVA déductible
     */
    calculateVATToPay(companyId: string, filters?: VATReportFilters): Promise<number>;
    /**
     * Générer le rapport TVA détaillé
     */
    generateVATReport(companyId: string, filters?: VATReportFilters): Promise<VATReport>;
    /**
     * Générer une déclaration TVA pour une période
     */
    generateVATDeclaration(companyId: string, period: string): Promise<VATDeclaration>;
}
declare const _default: TVAService;
export default _default;
//# sourceMappingURL=tva.service.d.ts.map