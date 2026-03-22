export interface ExchangeRate {
    id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    effective_date: Date;
    source: string;
}
export declare class ExchangeRateService {
    /**
     * Get the latest exchange rate between two currencies
     * @param fromCurrency Source currency code (e.g., 'USD')
     * @param toCurrency Target currency code (e.g., 'CDF')
     * @param date Optional date for historical rates (defaults to today)
     * @returns Exchange rate
     */
    getRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number>;
    /**
     * Convert an amount from one currency to another
     * @param amount Amount to convert
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param date Optional date for historical conversion
     * @returns Converted amount
     */
    convert(amount: number, fromCurrency: string, toCurrency: string, date?: Date): Promise<number>;
    /**
     * Manually set an exchange rate
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param rate Exchange rate
     * @param effectiveDate Date when this rate becomes effective
     */
    setRate(fromCurrency: string, toCurrency: string, rate: number, effectiveDate: Date): Promise<ExchangeRate>;
    /**
     * Get historical rates for a currency pair
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param startDate Start date
     * @param endDate End date
     * @returns Array of exchange rates
     */
    getHistoricalRates(fromCurrency: string, toCurrency: string, startDate: Date, endDate: Date): Promise<ExchangeRate[]>;
    /**
     * Delete old exchange rates (cleanup)
     * @param olderThan Delete rates older than this date
     */
    deleteOldRates(olderThan: Date): Promise<number>;
}
declare const _default: ExchangeRateService;
export default _default;
//# sourceMappingURL=exchangeRate.service.d.ts.map