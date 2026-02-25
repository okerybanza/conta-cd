export interface CurrencyHelperOptions {
    amount: number;
    currency: string;
    date?: Date;
}
export declare class CurrencyHelperService {
    /**
     * Convert an array of amounts to base currency
     * @param amounts Array of amounts with their currencies and dates
     * @param baseCurrency Target base currency
     * @returns Total amount in base currency
     */
    convertToBaseCurrency(amounts: Array<{
        amount: number;
        currency: string;
        date: Date;
    }>, baseCurrency: string): Promise<number>;
    /**
     * Format amount with currency symbol
     * @param amount Amount to format
     * @param currency Currency code
     * @returns Formatted string
     */
    formatAmount(amount: number, currency: string): string;
    /**
     * Get company base currency
     * @param companyId Company ID
     * @returns Base currency code
     */
    getCompanyBaseCurrency(companyId: string): Promise<string>;
    /**
     * Get supported currencies list
     * @returns Array of currency codes
     */
    getSupportedCurrencies(): string[];
}
declare const _default: CurrencyHelperService;
export default _default;
//# sourceMappingURL=currencyHelper.service.d.ts.map