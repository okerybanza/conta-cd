"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const logger_1 = __importDefault(require("../../utils/logger"));
class ExchangeRateService {
    /**
     * Get the latest exchange rate between two currencies
     * @param fromCurrency Source currency code (e.g., 'USD')
     * @param toCurrency Target currency code (e.g., 'CDF')
     * @param date Optional date for historical rates (defaults to today)
     * @returns Exchange rate
     */
    async getRate(fromCurrency, toCurrency, date) {
        // Same currency = rate of 1
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        const effectiveDate = date || new Date();
        const dateStr = effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD
        // SPRINT 3 - TASK 3.2 (UX-015): Cache exchange rates (24h TTL)
        const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`;
        const cached = await (await Promise.resolve().then(() => __importStar(require('../cache.service')))).default.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
        // Try to find exact rate for the date
        let rate = await database_1.default.exchange_rates.findFirst({
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
            await (await Promise.resolve().then(() => __importStar(require('../cache.service')))).default.set(cacheKey, rateValue, 86400);
            return rateValue;
        }
        // Try inverse rate (e.g., if USD->CDF not found, try CDF->USD and invert)
        rate = await database_1.default.exchange_rates.findFirst({
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
            await (await Promise.resolve().then(() => __importStar(require('../cache.service')))).default.set(cacheKey, rateValue, 86400);
            return rateValue;
        }
        throw new error_middleware_1.CustomError(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`, 404, 'RATE_NOT_FOUND');
    }
    /**
     * Convert an amount from one currency to another
     * @param amount Amount to convert
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param date Optional date for historical conversion
     * @returns Converted amount
     */
    async convert(amount, fromCurrency, toCurrency, date) {
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
    async setRate(fromCurrency, toCurrency, rate, effectiveDate) {
        if (fromCurrency === toCurrency) {
            throw new error_middleware_1.CustomError('Cannot set rate for same currency', 400, 'INVALID_CURRENCY_PAIR');
        }
        if (rate <= 0) {
            throw new error_middleware_1.CustomError('Rate must be positive', 400, 'INVALID_RATE');
        }
        const exchangeRate = await database_1.default.exchange_rates.upsert({
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
        logger_1.default.info(`Exchange rate set: ${fromCurrency}/${toCurrency} = ${rate}`, {
            fromCurrency,
            toCurrency,
            rate,
            effectiveDate,
        });
        return exchangeRate;
    }
    /**
     * Get historical rates for a currency pair
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @param startDate Start date
     * @param endDate End date
     * @returns Array of exchange rates
     */
    async getHistoricalRates(fromCurrency, toCurrency, startDate, endDate) {
        const rates = await database_1.default.exchange_rates.findMany({
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
        return rates;
    }
    /**
     * Delete old exchange rates (cleanup)
     * @param olderThan Delete rates older than this date
     */
    async deleteOldRates(olderThan) {
        const result = await database_1.default.exchange_rates.deleteMany({
            where: {
                effective_date: {
                    lt: olderThan,
                },
            },
        });
        logger_1.default.info(`Deleted ${result.count} old exchange rates`, { olderThan });
        return result.count;
    }
}
exports.ExchangeRateService = ExchangeRateService;
exports.default = new ExchangeRateService();
//# sourceMappingURL=exchangeRate.service.js.map