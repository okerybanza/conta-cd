import currencyUpdateService from '../services/currency/currencyUpdate.service';
import logger from '../utils/logger';

/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Daily Exchange Rate Update Script
 * 
 * Updates exchange rates from BCC and ECB providers
 * Run daily via cron job
 */

async function main() {
    try {
        logger.info('='.repeat(60));
        logger.info('Starting daily exchange rate update...');
        logger.info('='.repeat(60));

        const startTime = Date.now();

        // Update all companies with auto-update enabled
        await currencyUpdateService.updateAllCompanies();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        logger.info('='.repeat(60));
        logger.info(`Exchange rate update completed successfully in ${duration}s`);
        logger.info('='.repeat(60));

        process.exit(0);
    } catch (error) {
        logger.error('='.repeat(60));
        logger.error('Exchange rate update failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        logger.error('='.repeat(60));

        process.exit(1);
    }
}

// Run the update
main();
