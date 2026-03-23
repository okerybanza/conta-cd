import prisma from '../../config/database';
import logger from '../../utils/logger';
import ecbProvider from './providers/ecb.provider';
import bccProvider from './providers/bcc.provider';

/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Currency Update Service
 * 
 * Manages automatic exchange rate updates from external providers
 */

export class CurrencyUpdateService {
    /**
     * Update exchange rates for a specific company
     */
    async updateRatesForCompany(companyId: string): Promise<void> {
        try {
            logger.info(`Updating exchange rates for company: ${companyId}`);

            // Get company currency settings
            const settings = await prisma.currency_settings.findUnique({
                where: { company_id: companyId },
            });

            if (!settings || !settings.auto_update_rates) {
                logger.debug(`Auto-update disabled for company: ${companyId}`);
                return;
            }

            const provider = settings.rate_provider || 'manual';

            if (provider === 'manual') {
                logger.debug(`Manual rate provider for company: ${companyId}`);
                return;
            }

            // Fetch rates from appropriate provider
            let rates: any[] = [];

            if (provider === 'ecb') {
                // ECB provides EUR-based rates
                const ecbRates = await ecbProvider.fetchRates();
                rates = ecbRates;
            } else if (provider === 'bcc') {
                // BCC provides USD/CDF rate
                const bccRates = await bccProvider.fetchRates();
                rates = bccRates;
            } else if (provider === 'both') {
                // Use both providers
                const [ecbRates, bccRates] = await Promise.all([
                    ecbProvider.fetchRates(),
                    bccProvider.fetchRates(),
                ]);
                rates = [...ecbRates, ...bccRates];
            }

            // Store rates in database
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const rate of rates) {
                await prisma.exchange_rates.upsert({
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

                logger.debug(`Updated rate: ${rate.from}/${rate.to} = ${rate.rate}`);
            }

            // Update last_rate_update timestamp
            await prisma.currency_settings.update({
                where: { company_id: companyId },
                data: { last_rate_update: new Date() },
            });

            logger.info(`Successfully updated rates for company: ${companyId}`, {
                ratesCount: rates.length,
                provider,
            });

        } catch (error) {
            logger.error('Error updating rates for company', {
                companyId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Update exchange rates for all companies with auto-update enabled
     */
    async updateAllCompanies(): Promise<void> {
        try {
            logger.info('Starting automatic exchange rate update for all companies');

            const companies = await prisma.currency_settings.findMany({
                where: {
                    auto_update_rates: true,
                    rate_provider: { not: 'manual' },
                },
                select: { company_id: true },
            });

            logger.info(`Found ${companies.length} companies with auto-update enabled`);

            for (const company of companies) {
                try {
                    await this.updateRatesForCompany(company.company_id);
                } catch (error) {
                    logger.error(`Failed to update rates for company: ${company.company_id}`, {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    // Continue with other companies
                }
            }

            logger.info('Completed automatic exchange rate update for all companies');

        } catch (error) {
            logger.error('Error in updateAllCompanies', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Manually update USD/CDF rate from BCC
     * Can be called on-demand
     */
    async updateBCCRate(): Promise<number> {
        try {
            logger.info('Fetching USD/CDF rate from BCC...');

            const rates = await bccProvider.fetchRates();

            if (rates.length === 0) {
                throw new Error('No rates returned from BCC provider');
            }

            const usdCdfRate = rates[0];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Store in database
            await prisma.exchange_rates.upsert({
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
            await prisma.exchange_rates.upsert({
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

            logger.info(`Successfully updated USD/CDF rate: ${usdCdfRate.rate}`);
            return usdCdfRate.rate;

        } catch (error) {
            logger.error('Error updating BCC rate', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}

export default new CurrencyUpdateService();
