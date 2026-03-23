import prisma from '../../config/database';

export interface CurrencyHelperOptions {
    amount: number;
    currency: string;
    date?: Date;
}

export class CurrencyHelperService {
    /**
     * Convert an array of amounts to base currency
     * @param amounts Array of amounts with their currencies and dates
     * @param baseCurrency Target base currency
     * @returns Total amount in base currency
     */
    async convertToBaseCurrency(
        amounts: Array<{ amount: number; currency: string; date: Date }>,
        baseCurrency: string
    ): Promise<number> {
        const exchangeRateService = (await import('./exchangeRate.service')).default;

        let total = 0;
        for (const item of amounts) {
            if (item.currency === baseCurrency) {
                total += item.amount;
            } else {
                const converted = await exchangeRateService.convert(
                    item.amount,
                    item.currency,
                    baseCurrency,
                    item.date
                );
                total += converted;
            }
        }
        return total;
    }

    /**
     * Format amount with currency symbol
     * @param amount Amount to format
     * @param currency Currency code
     * @returns Formatted string
     */
    formatAmount(amount: number, currency: string): string {
        try {
            return new Intl.NumberFormat('fr-CD', {
                style: 'currency',
                currency: currency,
            }).format(amount);
        } catch (error) {
            // Fallback for unsupported currencies
            return `${amount.toFixed(2)} ${currency}`;
        }
    }

    /**
     * Get company base currency
     * @param companyId Company ID
     * @returns Base currency code
     */
    async getCompanyBaseCurrency(companyId: string): Promise<string> {
        const settings = await prisma.currency_settings.findUnique({
            where: { company_id: companyId },
            select: { base_currency: true },
        });

        return settings?.base_currency || 'CDF';
    }

    /**
     * Get supported currencies list
     * @returns Array of currency codes
     */
    getSupportedCurrencies(): string[] {
        return [
            'CDF', // Congolese Franc
            'USD', // US Dollar
            'EUR', // Euro
            'GBP', // British Pound
            'CHF', // Swiss Franc
            'CAD', // Canadian Dollar
            'AUD', // Australian Dollar
            'JPY', // Japanese Yen
            'CNY', // Chinese Yuan
            'ZAR', // South African Rand
            'XAF', // Central African CFA Franc
            'XOF', // West African CFA Franc
        ];
    }
}

export default new CurrencyHelperService();
