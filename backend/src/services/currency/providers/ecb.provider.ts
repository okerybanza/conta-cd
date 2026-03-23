import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import logger from '../../../utils/logger';

const parseXML = promisify(parseString);

export interface ECBRate {
    currency: string;
    rate: number;
}

/**
 * European Central Bank Exchange Rate Provider
 * Provides free daily exchange rates for 30+ currencies
 * Base currency: EUR
 */
export class ECBProvider {
    private readonly ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
    private readonly ECB_90_DAYS_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';

    /**
     * Fetch latest exchange rates from ECB
     * @returns Array of exchange rates relative to EUR
     */
    async fetchRates(): Promise<Array<{ from: string; to: string; rate: number; source: string }>> {
        try {
            const response = await axios.get(this.ECB_DAILY_URL, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Conta-App/1.0',
                },
            });

            const parsed: any = await parseXML(response.data);
            const cubes = parsed['gesmes:Envelope']['Cube'][0]['Cube'][0]['Cube'];

            const results: Array<{ from: string; to: string; rate: number; source: string }> = [];

            for (const cube of cubes) {
                const currency = cube.$.currency;
                const rate = parseFloat(cube.$.rate);
                results.push({ from: 'EUR', to: currency, rate, source: 'ecb' });
            }

            logger.info(`Fetched ${results.length} exchange rates from ECB`);
            return results;
        } catch (error: any) {
            logger.error('Error fetching rates from ECB', { error: error.message });
            throw new Error(`Failed to fetch rates from ECB: ${error.message}`);
        }
    }

    /**
     * Fetch historical rates for the last 90 days
     * @returns Array of { date, rates } objects
     */
    async fetchHistoricalRates(): Promise<Array<{ date: Date; rates: Map<string, number> }>> {
        try {
            const response = await axios.get(this.ECB_90_DAYS_URL, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Conta-App/1.0',
                },
            });

            const parsed: any = await parseXML(response.data);
            const timeCubes = parsed['gesmes:Envelope']['Cube'][0]['Cube'];

            const historicalRates: Array<{ date: Date; rates: Map<string, number> }> = [];

            for (const timeCube of timeCubes) {
                const date = new Date(timeCube.$.time);
                const rates = new Map<string, number>();

                rates.set('EUR', 1.0);

                const cubes = timeCube['Cube'];
                for (const cube of cubes) {
                    const currency = cube.$.currency;
                    const rate = parseFloat(cube.$.rate);
                    rates.set(currency, rate);
                }

                historicalRates.push({ date, rates });
            }

            logger.info(`Fetched ${historicalRates.length} days of historical rates from ECB`);
            return historicalRates;
        } catch (error: any) {
            logger.error('Error fetching historical rates from ECB', { error: error.message });
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
    convertRate(rates: Map<string, number>, fromCurrency: string, toCurrency: string): number {
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

export default new ECBProvider();
