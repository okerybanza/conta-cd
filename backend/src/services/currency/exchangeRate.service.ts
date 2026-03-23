import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';

export interface ExchangeRate {
    id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    effective_date: Date;
    source: string;
}

export class ExchangeRateService {
    /**
     * Get the latest exchange rate between two currencies
     * @param fromCurrency Source currency code (e.g., 'USD')
     * @param toCurrency Target currency code (e.g., 'CDF')
     * @param date Optional date for historical rates (defaults to today)
     * @returns Exchange rate
     */
    async getRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
        // Same currency = rate of 1
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        const effectiveDate = date || new Date();
        const dateStr = effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // SPRINT 3 - TASK 3.2 (UX-015): Cache exchange rates (24h TTL)
        const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`;
        const cached = await (await import('../cache.service')).default.get<number>(cacheKey);
        if (cached !== null) {
            return cached;
        }

        // Try to find exact rate for the date
        let rate = await prisma.exchange_rates.findFirst({
            where: {
                from_currency: fromCurrency,
                to_currency: toCurrency,
                effective_date: {
                    lte: effectiveDate,
                },
            },
            orderBy: {
                effective_date: 'desc',
            },
        });

        if (rate) {
            const rateValue = Number(rate.rate);
            // Cache for 24 hours (86400 seconds)
            await (await import('../cache.service')).default.set(cacheKey, rateValue, 86400);
            return rateValue;
        }

        // Try inverse rate (e.g., if USD->CDF not found, try CDF->USD and invert)
        rate = await prisma.exchange_rates.findFirst({
            where: {
                from_currency: toCurrency,
                to_currency: fromCurrency,
                effective_date: {
                    lte: effectiveDate,
                },
            },
            orderBy: {
                effective_date: 'desc',
            },
        });

        if (rate) {
            const rateValue = 1 / Number(rate.rate);
            // Cache for 24 hours
            await (await import('../cache.service')).default.set(cacheKey, rateValue, 86400);
            return rateValue;
        }

        throw new CustomError(
            `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
            404,
            'RATE_NOT_FOUND'
        );
    }

    /**
     * Convert an amount from one currency to another
     * @param amount Amount to convert
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param date Optional date for historical conversion
     * @returns Converted amount
     */
    async convert(
        amount: number,
        fromCurrency: string,
        toCurrency: string,
        date?: Date
    ): Promise<number> {
        const rate = await this.getRate(fromCurrency, toCurrency, date);
        return amount * rate;
    }

    /**
     * Manually set an exchange rate
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param rate Exchange rate
     * @param effectiveDate Date when this rate becomes effective
     */
    async setRate(
        fromCurrency: string,
        toCurrency: string,
        rate: number,
        effectiveDate: Date
    ): Promise<ExchangeRate> {
        if (fromCurrency === toCurrency) {
            throw new CustomError('Cannot set rate for same currency', 400, 'INVALID_CURRENCY_PAIR');
        }

        if (rate <= 0) {
            throw new CustomError('Rate must be positive', 400, 'INVALID_RATE');
        }

        const exchangeRate = await prisma.exchange_rates.upsert({
            where: {
                unique_rate_per_date: {
                    from_currency: fromCurrency,
                    to_currency: toCurrency,
                    effective_date: effectiveDate,
                },
            },
            update: {
                rate,
                updated_at: new Date(),
            },
            create: {
                from_currency: fromCurrency,
                to_currency: toCurrency,
                rate,
                effective_date: effectiveDate,
                source: 'manual',
            },
        });

        logger.info(`Exchange rate set: ${fromCurrency}/${toCurrency} = ${rate}`, {
            fromCurrency,
            toCurrency,
            rate,
            effectiveDate,
        });

        return exchangeRate as ExchangeRate;
    }

    /**
     * Get historical rates for a currency pair
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param startDate Start date
     * @param endDate End date
     * @returns Array of exchange rates
     */
    async getHistoricalRates(
        fromCurrency: string,
        toCurrency: string,
        startDate: Date,
        endDate: Date
    ): Promise<ExchangeRate[]> {
        const rates = await prisma.exchange_rates.findMany({
            where: {
                from_currency: fromCurrency,
                to_currency: toCurrency,
                effective_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                effective_date: 'asc',
            },
        });

        return rates as ExchangeRate[];
    }

    /**
     * Delete old exchange rates (cleanup)
     * @param olderThan Delete rates older than this date
     */
    async deleteOldRates(olderThan: Date): Promise<number> {
        const result = await prisma.exchange_rates.deleteMany({
            where: {
                effective_date: {
                    lt: olderThan,
                },
            },
        });

        logger.info(`Deleted ${result.count} old exchange rates`, { olderThan });
        return result.count;
    }
}

export default new ExchangeRateService();
