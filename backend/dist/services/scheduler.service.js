"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../utils/logger"));
const recurringInvoice_service_1 = __importDefault(require("./recurringInvoice.service"));
const reminder_service_1 = __importDefault(require("./reminder.service"));
const depreciation_service_1 = __importDefault(require("./depreciation.service"));
const balanceValidation_service_1 = __importDefault(require("./balanceValidation.service"));
const subscription_service_1 = __importDefault(require("./subscription.service"));
const trial_reminder_service_1 = __importDefault(require("./trial-reminder.service"));
const database_1 = __importDefault(require("../config/database"));
class SchedulerService {
    tasks = []; // cron.ScheduledTask[] - type temporaire
    /**
     * Démarrer tous les schedulers
     */
    start() {
        logger_1.default.info('Starting schedulers...');
        // Traiter les factures récurrentes - Tous les jours à 2h du matin
        const recurringTask = node_cron_1.default.schedule('0 2 * * *', async () => {
            logger_1.default.info('Running recurring invoices job');
            try {
                const results = await recurringInvoice_service_1.default.processRecurringInvoices();
                logger_1.default.info('Recurring invoices processed', { count: results.length });
            }
            catch (error) {
                logger_1.default.error('Error processing recurring invoices', { error: error.message });
            }
        });
        this.tasks.push(recurringTask);
        // Traiter les rappels de paiement - Tous les jours à 9h du matin
        const reminderTask = node_cron_1.default.schedule('0 9 * * *', async () => {
            logger_1.default.info('Running payment reminders job');
            try {
                const results = await reminder_service_1.default.processPaymentReminders();
                logger_1.default.info('Payment reminders processed', { count: results.length });
            }
            catch (error) {
                logger_1.default.error('Error processing payment reminders', { error: error.message });
            }
        });
        this.tasks.push(reminderTask);
        // Générer les écritures d'amortissement - Le 1er de chaque mois à 3h du matin
        const depreciationTask = node_cron_1.default.schedule('0 3 1 * *', async () => {
            logger_1.default.info('Running monthly depreciation entries job');
            try {
                const results = await depreciation_service_1.default.processMonthlyDepreciations();
                const successful = results.filter((r) => r.success && !r.skipped).length;
                const skipped = results.filter((r) => r.skipped).length;
                const failed = results.filter((r) => !r.success).length;
                logger_1.default.info('Monthly depreciation entries processed', {
                    total: results.length,
                    successful,
                    skipped,
                    failed,
                });
            }
            catch (error) {
                logger_1.default.error('Error processing monthly depreciation entries', {
                    error: error.message,
                    stack: error.stack,
                });
            }
        });
        this.tasks.push(depreciationTask);
        // Recalculer les soldes - Tous les jours à 2h30 du matin
        const balanceValidationTask = node_cron_1.default.schedule('30 2 * * *', async () => {
            logger_1.default.info('Running daily balance recalculation job');
            try {
                // Récupérer toutes les entreprises actives
                const companies = await database_1.default.companies.findMany({
                    where: { deletedAt: null },
                    select: { id: true, name: true },
                });
                let totalRecalculated = 0;
                let totalAdjustment = 0;
                for (const company of companies) {
                    try {
                        const result = await balanceValidation_service_1.default.recalculateAllBalances(company.id);
                        totalRecalculated += result.recalculated;
                        totalAdjustment += Number(result.totalAdjustment || 0);
                        logger_1.default.info(`Balance recalculation completed for company ${company.name}`, {
                            companyId: company.id,
                            recalculated: result.recalculated,
                            totalAdjustment: result.totalAdjustment,
                        });
                    }
                    catch (error) {
                        logger_1.default.error(`Error recalculating balances for company ${company.name}`, {
                            companyId: company.id,
                            error: error.message,
                        });
                    }
                }
                logger_1.default.info('Daily balance recalculation completed', {
                    totalCompanies: companies.length,
                    totalRecalculated,
                    totalAdjustment,
                });
            }
            catch (error) {
                logger_1.default.error('Error processing daily balance recalculation', {
                    error: error.message,
                    stack: error.stack,
                });
            }
        });
        this.tasks.push(balanceValidationTask);
        // ── Abonnements : expirer les essais et abonnements terminés ──
        // Tous les jours à 0h30
        const subscriptionExpirationTask = node_cron_1.default.schedule('30 0 * * *', async () => {
            logger_1.default.info('Running subscription expiration job');
            try {
                const trialResults = await subscription_service_1.default.expireTrials();
                const subResults = await subscription_service_1.default.expireSubscriptions();
                logger_1.default.info('Subscription expiration job completed', {
                    trialsExpired: trialResults.expired,
                    subscriptionsExpired: subResults.expired,
                });
            }
            catch (error) {
                logger_1.default.error('Error in subscription expiration job', { error: error.message });
            }
        });
        this.tasks.push(subscriptionExpirationTask);
        // ── Abonnements : rappels d'essai (J-7, J-3, J-1, J-0) ──
        // Tous les jours à 8h du matin
        const trialReminderTask = node_cron_1.default.schedule('0 8 * * *', async () => {
            logger_1.default.info('Running trial reminder job');
            try {
                const results = await trial_reminder_service_1.default.processTrialReminders();
                logger_1.default.info('Trial reminders processed', {
                    total: results.length,
                    successful: results.filter((r) => r.success).length,
                });
            }
            catch (error) {
                logger_1.default.error('Error processing trial reminders', { error: error.message });
            }
        });
        this.tasks.push(trialReminderTask);
        logger_1.default.info('Schedulers started', { taskCount: this.tasks.length });
    }
    /**
     * Arrêter tous les schedulers
     */
    stop() {
        logger_1.default.info('Stopping schedulers...');
        this.tasks.forEach((task) => task.stop());
        this.tasks = [];
        logger_1.default.info('Schedulers stopped');
    }
}
exports.SchedulerService = SchedulerService;
exports.default = new SchedulerService();
//# sourceMappingURL=scheduler.service.js.map