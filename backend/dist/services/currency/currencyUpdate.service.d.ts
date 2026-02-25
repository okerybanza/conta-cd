/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Currency Update Service
 *
 * Manages automatic exchange rate updates from external providers
 */
export declare class CurrencyUpdateService {
    /**
     * Update exchange rates for a specific company
     */
    updateRatesForCompany(companyId: string): Promise<void>;
    /**
     * Update exchange rates for all companies with auto-update enabled
     */
    updateAllCompanies(): Promise<void>;
    /**
     * Manually update USD/CDF rate from BCC
     * Can be called on-demand
     */
    updateBCCRate(): Promise<number>;
}
declare const _default: CurrencyUpdateService;
export default _default;
//# sourceMappingURL=currencyUpdate.service.d.ts.map