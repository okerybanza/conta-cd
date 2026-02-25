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
exports.TrialReminderService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service pour gérer les rappels de fin d'essai
 */
class TrialReminderService {
    /**
     * Envoyer un email de rappel pour un essai qui se termine
     */
    async sendTrialReminder(userId, userEmail, firstName, companyName, data) {
        try {
            const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
            const env = (await Promise.resolve().then(() => __importStar(require('../config/env')))).default;
            let template;
            let subject;
            // Déterminer le template selon le nombre de jours restants
            if (data.daysRemaining === 7) {
                template = 'trial-reminder-7days';
                subject = `Rappel - Votre essai se termine dans 7 jours`;
            }
            else if (data.daysRemaining === 3) {
                template = 'trial-reminder-3days';
                subject = `Rappel - Votre essai se termine dans 3 jours`;
            }
            else if (data.daysRemaining === 1) {
                template = 'trial-reminder-1day';
                subject = `Dernière chance - Votre essai se termine demain`;
            }
            else if (data.daysRemaining === 0) {
                template = 'trial-expired';
                subject = `Votre essai est terminé - Abonnez-vous maintenant`;
            }
            else {
                // Pour les autres cas, utiliser le template 7 jours
                template = 'trial-reminder-7days';
                subject = `Rappel - Votre essai se termine bientôt`;
            }
            const trialEndDateFormatted = new Date(data.trialEndDate).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            await emailService.sendEmail({
                from: (process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || ''),
                to: userEmail,
                subject,
                template,
                data: {
                    firstName: firstName || 'Utilisateur',
                    companyName,
                    packageName: data.packageName,
                    trialEndDate: trialEndDateFormatted,
                    amount: data.amount,
                    currency: data.currency,
                    billingCycleText: data.billingCycle === 'monthly' ? 'mois' : 'année',
                    subscriptionUrl: data.subscriptionUrl,
                    supportEmail: data.supportEmail || env.SUPPORT_EMAIL || 'support@conta.cd',
                },
            });
            logger_1.default.info('Trial reminder email sent', {
                userId,
                email: userEmail,
                daysRemaining: data.daysRemaining,
            });
            return { success: true };
        }
        catch (error) {
            logger_1.default.error('Error sending trial reminder email', {
                userId,
                email: userEmail,
                daysRemaining: data.daysRemaining,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Traiter tous les rappels d'essai à envoyer aujourd'hui
     * À appeler par un cron job quotidien
     */
    async processTrialReminders() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // Calculer les dates pour J-7, J-3, J-1, J-0
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);
        const in3Days = new Date(now);
        in3Days.setDate(in3Days.getDate() + 3);
        const in1Day = new Date(now);
        in1Day.setDate(in1Day.getDate() + 1);
        const today = new Date(now);
        const results = [];
        try {
            const env = (await Promise.resolve().then(() => __importStar(require('../config/env')))).default;
            const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
            // Trouver les essais qui se terminent dans 7 jours
            const trialsEndingIn7Days = await this.findTrialsEndingOn(in7Days);
            for (const subscription of trialsEndingIn7Days) {
                const result = await this.sendReminderForSubscription(subscription, 7, frontendUrl);
                results.push(result);
            }
            // Trouver les essais qui se terminent dans 3 jours
            const trialsEndingIn3Days = await this.findTrialsEndingOn(in3Days);
            for (const subscription of trialsEndingIn3Days) {
                const result = await this.sendReminderForSubscription(subscription, 3, frontendUrl);
                results.push(result);
            }
            // Trouver les essais qui se terminent dans 1 jour
            const trialsEndingIn1Day = await this.findTrialsEndingOn(in1Day);
            for (const subscription of trialsEndingIn1Day) {
                const result = await this.sendReminderForSubscription(subscription, 1, frontendUrl);
                results.push(result);
            }
            // Trouver les essais qui se terminent aujourd'hui
            const trialsEndingToday = await this.findTrialsEndingOn(today);
            for (const subscription of trialsEndingToday) {
                const result = await this.sendReminderForSubscription(subscription, 0, frontendUrl);
                results.push(result);
            }
            logger_1.default.info('Trial reminders processed', {
                totalProcessed: results.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            });
            return results;
        }
        catch (error) {
            logger_1.default.error('Error processing trial reminders', {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Trouver les abonnements en essai qui se terminent à une date donnée
     */
    async findTrialsEndingOn(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const subscriptions = await database_1.default.subscriptions.findMany({
            where: {
                status: 'trial',
                trial_ends_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                packages: true,
            },
        });
        // Charger les entreprises et utilisateurs séparément pour chaque abonnement
        const subscriptionsWithCompanies = await Promise.all(subscriptions.map(async (sub) => {
            const company = await database_1.default.companies.findUnique({
                where: { id: sub.company_id },
                include: {
                    users: {
                        where: {
                            deleted_at: null,
                            email_verified: true,
                            role: 'admin', // Envoyer seulement aux admins
                        },
                        take: 5, // Limiter à 5 admins par entreprise
                    },
                },
            });
            return {
                ...sub,
                companies: company,
            };
        }));
        return subscriptionsWithCompanies;
    }
    /**
     * Envoyer les rappels pour un abonnement spécifique
     */
    async sendReminderForSubscription(subscription, daysRemaining, frontendUrl) {
        const result = {
            subscriptionId: subscription.id,
            companyId: subscription.company_id,
            daysRemaining,
            emailsSent: 0,
            success: false,
        };
        try {
            const env = (await Promise.resolve().then(() => __importStar(require('../config/env')))).default;
            const packageData = subscription.packages;
            const company = subscription.companies;
            if (!packageData || !company) {
                logger_1.default.warn('Missing package or company data for trial reminder', {
                    subscriptionId: subscription.id,
                });
                return result;
            }
            const amount = Number(packageData.price || 0).toLocaleString('fr-FR');
            const currency = packageData.currency || 'CDF';
            const billingCycle = subscription.billing_cycle || 'monthly';
            const billingCycleText = billingCycle === 'monthly' ? 'mois' : 'année';
            const reminderData = {
                daysRemaining,
                trialEndDate: subscription.trial_ends_at,
                packageName: packageData.name || 'Plan actuel',
                amount,
                currency,
                billingCycle: billingCycleText,
                subscriptionUrl: `${frontendUrl}/settings/subscription`,
                supportEmail: env.SUPPORT_EMAIL || 'support@conta.cd',
            };
            // Envoyer à tous les admins de l'entreprise
            for (const user of company.users) {
                try {
                    await this.sendTrialReminder(user.id, user.email, user.first_name || 'Utilisateur', company.name, reminderData);
                    result.emailsSent++;
                }
                catch (error) {
                    logger_1.default.error('Error sending trial reminder to user', {
                        userId: user.id,
                        email: user.email,
                        error: error.message,
                    });
                }
            }
            result.success = result.emailsSent > 0;
        }
        catch (error) {
            logger_1.default.error('Error processing trial reminder for subscription', {
                subscriptionId: subscription.id,
                error: error.message,
            });
        }
        return result;
    }
}
exports.TrialReminderService = TrialReminderService;
exports.default = new TrialReminderService();
//# sourceMappingURL=trial-reminder.service.js.map