export interface ECBRate {
    currency: string;
    rate: number;
}
/**
 * European Central Bank Exchange Rate Provider
 * Provides free daily exchange rates for 30+ currencies
 * Base currency: EUR
 */
export declare class ECBProvider {
    private readonly ECB_DAILY_URL;
    private readonly ECB_90_DAYS_URL;
    /**
     * Fetch latest exchange rates from ECB
     * @returns Array of exchange rates relative to EUR
     */
    fetchRates(): Promise<Array<{
        from: string;
        to: string;
        rate: number;
        source: string;
    }>>;
    /**
     * Fetch historical rates for the last 90 days
     * @returns Array of { date, rates } objects
     */
    fetchHistoricalRates(): Promise<Array<{
        date: Date;
        rates: Map<string, number>;
    }>>;
    /**
     * Convert a rate from EUR-based to any currency pair
     * @param rates Map of EUR-based rates
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @returns Conversion rate
     */
    convertRate(rates: Map<string, number>, fromCurrency: string, toCurrency: string): number;
}
declare const _default: ECBProvider;
export default _default;
//# sourceMappingURL=ecb.provider.d.ts.map