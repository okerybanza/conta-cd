/**
 * SPRINT 2 - TASK 2.4 (FIN-003): BCC Provider
 * SPRINT 5 - TASK 5.2 (ARCH-015): Resilience Pattern (Circuit Breaker)
 *
 * Fetches official USD/CDF exchange rate from Banque Centrale du Congo
 */
export interface BCCRate {
    from: string;
    to: string;
    rate: number;
    date: Date;
    source: string;
}
export declare class BCCProvider {
    private readonly baseUrl;
    private readonly circuitBreaker;
    constructor();
    /**
     * Fetch USD/CDF rate from BCC website via Circuit Breaker
     */
    fetchRates(): Promise<BCCRate[]>;
    private _doFetchRates;
    private _fallback;
    private isValidRate;
}
declare const _default: BCCProvider;
export default _default;
//# sourceMappingURL=bcc.provider.d.ts.map