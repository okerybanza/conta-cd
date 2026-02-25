"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const currencyUpdate_service_1 = __importDefault(require("../services/currency/currencyUpdate.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * SPRINT 2 - TASK 2.4 (FIN-003): Daily Exchange Rate Update Script
 *
 * Updates exchange rates from BCC and ECB providers
 * Run daily via cron job
 */
async function main() {
    try {
        logger_1.default.info('='.repeat(60));
        logger_1.default.info('Starting daily exchange rate update...');
        logger_1.default.info('='.repeat(60));
        const startTime = Date.now();
        // Update all companies with auto-update enabled
        await currencyUpdate_service_1.default.updateAllCompanies();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger_1.default.info('='.repeat(60));
        logger_1.default.info(`Exchange rate update completed successfully in ${duration}s`);
        logger_1.default.info('='.repeat(60));
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('='.repeat(60));
        logger_1.default.error('Exchange rate update failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        logger_1.default.error('='.repeat(60));
        process.exit(1);
    }
}
// Run the update
main();
//# sourceMappingURL=updateExchangeRates.js.map