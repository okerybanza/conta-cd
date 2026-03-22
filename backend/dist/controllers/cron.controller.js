"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronController = void 0;
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Controller pour les tâches cron (appelées par un service externe ou un cron job)
 */
class CronController {
    /**
     * POST /api/v1/cron/expire-subscriptions
     * Expirer les essais et abonnements dont la date est dépassée.
     * À appeler quotidiennement par un cron job.
     */
    async expireSubscriptions(req, res, next) {
        try {
            const cronSecret = process.env.CRON_SECRET;
            if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
            }
            const trialResults = await subscription_service_1.default.expireTrials();
            const subResults = await subscription_service_1.default.expireSubscriptions();
            const results = {
                trialsExpired: trialResults.expired,
                subscriptionsExpired: subResults.expired,
            };
            logger_1.default.info('Cron job: expire subscriptions completed', results);
            res.json({
                success: true,
                data: results,
                message: `Expiration terminée: ${results.trialsExpired} essai(s) expiré(s), ${results.subscriptionsExpired} abonnement(s) expiré(s)`,
            });
        }
        catch (error) {
            logger_1.default.error('Error in expire subscriptions cron job', {
                error: error.message,
                stack: error.stack,
            });
            next(error);
        }
    }
}
exports.CronController = CronController;
exports.default = new CronController();
//# sourceMappingURL=cron.controller.js.map