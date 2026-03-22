/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Multi-Currency Reporting Service
 */
export interface CurrencyBreakdown {
    currency: string;
    baseCurrency: string;
    invoices: {
        count: number;
        total: number;
        baseTotal: number;
    };
    expenses: {
        count: number;
        total: number;
        baseTotal: number;
    };
    payments: {
        count: number;
        total: number;
        baseTotal: number;
    };
    averageRate: number;
    netPosition: number;
}
export interface CurrencyBreakdownReport {
    period: {
        start: Date;
        end: Date;
    };
    baseCurrency: string;
    breakdown: CurrencyBreakdown[];
    totals: {
        invoicesBase: number;
        expensesBase: number;
        paymentsBase: number;
        netBase: number;
    };
}
export declare class MultiCurrencyReportService {
    getCurrencyBreakdown(companyId: string, startDate: Date, endDate: Date): Promise<CurrencyBreakdownReport>;
    getExchangeRateHistory(startDate: Date, endDate: Date, currencies?: string[]): Promise<any>;
    getCurrencyExposure(companyId: string): Promise<any>;
}
declare const _default: MultiCurrencyReportService;
export default _default;
//# sourceMappingURL=multiCurrencyReport.service.d.ts.map