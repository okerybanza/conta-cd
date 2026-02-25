"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyUpdateService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = __importDefault(require("../../utils/logger"));
const ecb_provider_1 = __importDefault(require("./providers/ecb.provider"));
const bcc_provider_1 = __importDefault(require("./providers/bcc.provider"));
/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Currency Update Service
 *
 * Manages automatic exchange rate updates from external providers
 */
class CurrencyUpdateService {
    /**
     * Update exchange rates for a specific company
     */
    async updateRatesForCompany(companyId) {
        try {
            logger_1.default.info(`Updating exchange rates for company: ${companyId}`);
            // Get company currency settings
            const settings = await database_1.default.currency_settings.findUnique({
                where: { company_id: companyId },
            });
            if (!settings || !settings.auto_update_rates) {
                logger_1.default.debug(`Auto-update disabled for company: ${companyId}`);
                return;
            }
            const provider = settings.rate_provider || 'manual';
            if (provider === 'manual') {
                logger_1.default.debug(`Manual rate provider for company: ${companyId}`);
                return;
            }
            // Fetch rates from appropriate provider
            let rates = [];
            if (provider === 'ecb') {
                // ECB provides EUR-based rates
                const ecbRates = await ecb_provider_1.default.fetchRates();
                rates = ecbRates;
            }
            else if (provider === 'bcc') {
                // BCC provides USD/CDF rate
                const bccRates = await bcc_provider_1.default.fetchRates();
                rates = bccRates;
            }
            else if (provider === 'both') {
                // Use both providers
                const [ecbRates, bccRates] = await Promise.all([
                    ecb_provider_1.default.fetchRates(),
                    bcc_provider_1.default.fetchRates(),
                ]);
                rates = [...ecbRates, ...bccRates];
            }
            // Store rates in database
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (const rate of rates) {
                await database_1.default.exchange_rates.upsert({
                    where: {
                        from_currency_to_currency_effective_date: {
                            from_currency: rate.from,
                            to_currency: rate.to,
                            effective_date: today,
                        },
                    },
                    update: {
                        rate: rate.rate,
                        source: rate.source || provider,
                        updated_at: new Date(),
                    },
                    create: {
                        from_currency: rate.from,
                        to_currency: rate.to,
                        rate: rate.rate,
                        effective_date: today,
                        source: rate.source || provider,
                    },
                });
                logger_1.default.debug(`Updated rate: ${rate.from}/${rate.to} = ${rate.rate}`);
            }
            // Update last_rate_update timestamp
            await database_1.default.currency_settings.update({
                where: { company_id: companyId },
                data: { last_rate_update: new Date() },
            });
            logger_1.default.info(`Successfully updated rates for company: ${companyId}`, {
                ratesCount: rates.length,
                provider,
            });
        }
        catch (error) {
            logger_1.default.error('Error updating rates for company', {
                companyId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Update exchange rates for all companies with auto-update enabled
     */
    async updateAllCompanies() {
        try {
            logger_1.default.info('Starting automatic exchange rate update for all companies');
            const companies = await database_1.default.currency_settings.findMany({
                where: {
                    auto_update_rates: true,
                    rate_provider: { not: 'manual' },
                },
                select: { company_id: true },
            });
            logger_1.default.info(`Found ${companies.length} companies with auto-update enabled`);
            for (const company of companies) {
                try {
                    await this.updateRatesForCompany(company.company_id);
                }
                catch (error) {
                    logger_1.default.error(`Failed to update rates for company: ${company.company_id}`, {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    // Continue with other companies
                }
            }
            logger_1.default.info('Completed automatic exchange rate update for all companies');
        }
        catch (error) {
            logger_1.default.error('Error in updateAllCompanies', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Manually update USD/CDF rate from BCC
     * Can be called on-demand
     */
    async updateBCCRate() {
        try {
            logger_1.default.info('Fetching USD/CDF rate from BCC...');
            const rates = await bcc_provider_1.default.fetchRates();
            if (rates.length === 0) {
                throw new Error('No rates returned from BCC provider');
            }
            const usdCdfRate = rates[0];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Store in database
            await database_1.default.exchange_rates.upsert({
                where: {
                    from_currency_to_currency_effective_date: {
                        from_currency: 'USD',
                        to_currency: 'CDF',
                        effective_date: today,
                    },
                },
                update: {
                    rate: usdCdfRate.rate,
                    source: 'bcc',
                    updated_at: new Date(),
                },
                create: {
                    from_currency: 'USD',
                    to_currency: 'CDF',
                    rate: usdCdfRate.rate,
                    effective_date: today,
                    source: 'bcc',
                },
            });
            // Also create inverse rate (CDF/USD)
            await database_1.default.exchange_rates.upsert({
                where: {
                    from_currency_to_currency_effective_date: {
                        from_currency: 'CDF',
                        to_currency: 'USD',
                        effective_date: today,
                    },
                },
                update: {
                    rate: 1 / usdCdfRate.rate,
                    source: 'bcc',
                    updated_at: new Date(),
                },
                create: {
                    from_currency: 'CDF',
                    to_currency: 'USD',
                    rate: 1 / usdCdfRate.rate,
                    effective_date: today,
                    source: 'bcc',
                },
            });
            logger_1.default.info(`Successfully updated USD/CDF rate: ${usdCdfRate.rate}`);
            return usdCdfRate.rate;
        }
        catch (error) {
            logger_1.default.error('Error updating BCC rate', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.CurrencyUpdateService = CurrencyUpdateService;
exports.default = new CurrencyUpdateService();
//# sourceMappingURL=currencyUpdate.service.js.map