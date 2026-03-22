"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECBProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = require("xml2js");
const util_1 = require("util");
const logger_1 = __importDefault(require("../../../utils/logger"));
const parseXML = (0, util_1.promisify)(xml2js_1.parseString);
/**
 * European Central Bank Exchange Rate Provider
 * Provides free daily exchange rates for 30+ currencies
 * Base currency: EUR
 */
class ECBProvider {
    ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
    ECB_90_DAYS_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';
    /**
     * Fetch latest exchange rates from ECB
     * @returns Array of exchange rates relative to EUR
     */
    async fetchRates() {
        try {
            const response = await axios_1.default.get(this.ECB_DAILY_URL, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Conta-App/1.0',
                },
            });
            const parsed = await parseXML(response.data);
            const cubes = parsed['gesmes:Envelope']['Cube'][0]['Cube'][0]['Cube'];
            const results = [];
            for (const cube of cubes) {
                const currency = cube.$.currency;
                const rate = parseFloat(cube.$.rate);
                results.push({ from: 'EUR', to: currency, rate, source: 'ecb' });
            }
            logger_1.default.info(`Fetched ${results.length} exchange rates from ECB`);
            return results;
        }
        catch (error) {
            logger_1.default.error('Error fetching rates from ECB', { error: error.message });
            throw new Error(`Failed to fetch rates from ECB: ${error.message}`);
        }
    }
    /**
     * Fetch historical rates for the last 90 days
     * @returns Array of { date, rates } objects
     */
    async fetchHistoricalRates() {
        try {
            const response = await axios_1.default.get(this.ECB_90_DAYS_URL, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Conta-App/1.0',
                },
            });
            const parsed = await parseXML(response.data);
            const timeCubes = parsed['gesmes:Envelope']['Cube'][0]['Cube'];
            const historicalRates = [];
            for (const timeCube of timeCubes) {
                const date = new Date(timeCube.$.time);
                const rates = new Map();
                rates.set('EUR', 1.0);
                const cubes = timeCube['Cube'];
                for (const cube of cubes) {
                    const currency = cube.$.currency;
                    const rate = parseFloat(cube.$.rate);
                    rates.set(currency, rate);
                }
                historicalRates.push({ date, rates });
            }
            logger_1.default.info(`Fetched ${historicalRates.length} days of historical rates from ECB`);
            return historicalRates;
        }
        catch (error) {
            logger_1.default.error('Error fetching historical rates from ECB', { error: error.message });
            throw new Error(`Failed to fetch historical rates from ECB: ${error.message}`);
        }
    }
    /**
     * Convert a rate from EUR-based to any currency pair
     * @param rates Map of EUR-based rates
     * @param fromCurrency Source currency
     * @param toCurrency Target currency
     * @returns Conversion rate
     */
    convertRate(rates, fromCurrency, toCurrency) {
        const fromRate = rates.get(fromCurrency);
        const toRate = rates.get(toCurrency);
        if (!fromRate || !toRate) {
            throw new Error(`Currency not found: ${!fromRate ? fromCurrency : toCurrency}`);
        }
        // Convert: 1 fromCurrency = ? toCurrency
        // EUR -> fromCurrency rate is fromRate
        // EUR -> toCurrency rate is toRate
        // So: 1 fromCurrency = (1 / fromRate) EUR = (1 / fromRate) * toRate toCurrency
        return toRate / fromRate;
    }
}
exports.ECBProvider = ECBProvider;
exports.default = new ECBProvider();
//# sourceMappingURL=ecb.provider.js.map