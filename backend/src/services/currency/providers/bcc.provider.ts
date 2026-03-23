import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../../utils/logger';
import { CircuitBreaker } from '../../../utils/circuit-breaker';

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

export class BCCProvider {
    private readonly baseUrl = 'https://www.bcc.cd/';
    private readonly circuitBreaker: CircuitBreaker;

    constructor() {
        this.circuitBreaker = new CircuitBreaker('BCC-API', {
            failureThreshold: 3,
            resetTimeout: 60000, // 1 minute before retry if failed
            successThreshold: 1,
        });
    }

    /**
     * Fetch USD/CDF rate from BCC website via Circuit Breaker
     */
    async fetchRates(): Promise<BCCRate[]> {
        return this.circuitBreaker.execute(
            () => this._doFetchRates(),
            (error) => this._fallback(error)
        );
    }

    private async _doFetchRates(): Promise<BCCRate[]> {
        logger.info('Fetching USD/CDF rate from BCC...');

        const response = await axios.get(this.baseUrl, {
            timeout: 8000, // 8 seconds timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);
        let usdRate: number | null = null;

        // Strategy 1: Look for text containing "USD" and a number
        $('*').each((_, element) => {
            const text = $(element).text();
            const patterns = [
                /1\s*USD\s*=\s*([\d,\.]+)\s*FC/i,
                /USD\s*:\s*([\d,\.]+)/i,
                /\$\s*1\s*=\s*([\d,\.]+)/i,
                /Taux\s*USD\s*:\s*([\d,\.]+)/i,
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    const rate = parseFloat(match[1].replace(/,/g, ''));
                    if (this.isValidRate(rate)) {
                        usdRate = rate;
                        return false;
                    }
                }
            }
        });

        if (!usdRate) {
            throw new Error('Could not extract valid USD rate from BCC page content');
        }

        return [
            {
                from: 'USD',
                to: 'CDF',
                rate: usdRate,
                date: new Date(),
                source: 'bcc',
            },
        ];
    }

    private async _fallback(error: Error | null): Promise<BCCRate[]> {
        logger.warn('BCC Provider is using fallback due to error or open circuit', {
            error: error?.message || 'Circuit is OPEN',
        });

        return [
            {
                from: 'USD',
                to: 'CDF',
                rate: 2250, // Safe default
                date: new Date(),
                source: 'bcc_fallback',
            },
        ];
    }

    private isValidRate(rate: number): boolean {
        return rate >= 1500 && rate <= 5000;
    }
}

export default new BCCProvider();
