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
exports.SubscriptionService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const package_service_1 = __importDefault(require("./package.service"));
const crypto_1 = require("crypto");
class SubscriptionService {
    // ────────────────────────────────────────────────
    // Helpers internes
    // ────────────────────────────────────────────────
    /**
     * Calculer les dates et le statut pour un nouveau plan.
     */
    computePlanData(pkg, data) {
        const startDate = data.startDate || new Date();
        const price = Number(pkg.price ?? 0);
        const isFreePlan = pkg.code === 'STARTER' || price === 0;
        let status;
        let trialEndsAt = null;
        if (isFreePlan) {
            status = 'active';
        }
        else {
            status = 'trial';
            const trialDays = data.trialDays || 14;
            trialEndsAt = new Date(startDate);
            trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
        }
        const endDate = new Date(startDate);
        if (data.billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        return { startDate, endDate, status, trialEndsAt, isFreePlan };
    }
    /**
     * Charger le package attaché à un abonnement (fallback si le include Prisma a échoué).
     */
    async ensurePackageLoaded(subscription) {
        if (!subscription.packages && subscription.package_id) {
            const pkg = await database_1.default.packages.findUnique({
                where: { id: subscription.package_id },
            });
            if (pkg) {
                subscription.packages = pkg;
            }
            else {
                logger_1.default.error('Package not found for subscription', {
                    subscriptionId: subscription.id,
                    packageId: subscription.package_id,
                });
            }
        }
    }
    // ────────────────────────────────────────────────
    // Lecture
    // ────────────────────────────────────────────────
    /**
     * Obtenir l'abonnement d'une entreprise (quel que soit son statut).
     * Applique les transitions automatiques :
     *   trial  → expired  si trial_ends_at dépassé
     *   active → expired  si end_date dépassé
     *
     * Retourne TOUJOURS l'abonnement s'il existe, même s'il est expiré.
     * Lance SUBSCRIPTION_NOT_FOUND uniquement si aucun enregistrement n'existe.
     */
    async getActive(companyId) {
        // company_id est @unique → findUnique est garanti de fonctionner
        const subscription = await database_1.default.subscriptions.findUnique({
            where: { company_id: companyId },
            include: { packages: true },
        });
        if (!subscription) {
            throw new error_middleware_1.CustomError('No subscription found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }
        const now = new Date();
        // Transition trial → expired si trial_ends_at dépassé
        if (subscription.status === 'trial' && subscription.trial_ends_at && subscription.trial_ends_at < now) {
            await database_1.default.subscriptions.update({
                where: { id: subscription.id },
                data: { status: 'expired', updated_at: now },
            });
            subscription.status = 'expired';
            logger_1.default.info(`Trial expired for subscription ${subscription.id}`, { companyId });
        }
        // Transition active → expired si end_date dépassé
        if (subscription.status === 'active' && subscription.end_date && subscription.end_date < now) {
            await database_1.default.subscriptions.update({
                where: { id: subscription.id },
                data: { status: 'expired', updated_at: now },
            });
            subscription.status = 'expired';
            logger_1.default.info(`Subscription expired for ${subscription.id}`, { companyId });
        }
        // Charger le package en fallback si nécessaire
        await this.ensurePackageLoaded(subscription);
        return subscription;
    }
    /**
     * Vérifier si une entreprise est en période d'essai valide.
     */
    async isTrial(companyId) {
        try {
            const subscription = await this.getActive(companyId);
            // getActive() applique déjà la transition trial→expired,
            // donc si le statut est encore 'trial' ici, c'est qu'il est valide.
            return subscription.status === 'trial';
        }
        catch {
            return false;
        }
    }
    // ────────────────────────────────────────────────
    // Création (compatible avec company_id @unique)
    // ────────────────────────────────────────────────
    /**
     * Créer ou réactiver un abonnement pour une entreprise.
     *
     * Logique :
     * - Si aucun abonnement → créer un nouveau
     * - Si abonnement active/trial → erreur SUBSCRIPTION_EXISTS
     * - Si abonnement expired/cancelled → mettre à jour l'existant (réactiver)
     */
    async create(companyId, data) {
        const pkg = await package_service_1.default.getById(data.packageId);
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { id: true },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        // Vérifier s'il y a déjà un abonnement (company_id est @unique)
        const existing = await database_1.default.subscriptions.findUnique({
            where: { company_id: companyId },
        });
        const plan = this.computePlanData(pkg, data);
        if (existing) {
            // Abonnement actif ou en trial → interdire la double création
            if (existing.status === 'active' || existing.status === 'trial') {
                throw new error_middleware_1.CustomError('Un abonnement actif ou en essai existe déjà pour cette entreprise.', 409, 'SUBSCRIPTION_EXISTS');
            }
            // Abonnement expired ou cancelled → réactiver avec le nouveau plan
            const reactivated = await database_1.default.subscriptions.update({
                where: { id: existing.id },
                data: {
                    package_id: data.packageId,
                    status: plan.status,
                    billing_cycle: data.billingCycle,
                    start_date: plan.startDate,
                    end_date: plan.endDate,
                    trial_ends_at: plan.trialEndsAt,
                    next_payment_date: plan.endDate,
                    last_payment_date: null,
                    cancelled_at: null,
                    cancelled_by: null,
                    updated_at: new Date(),
                },
                include: { packages: true },
            });
            logger_1.default.info(`Subscription reactivated: ${reactivated.id}`, {
                companyId,
                packageId: data.packageId,
                status: reactivated.status,
            });
            try {
                const fiscalPeriodService = (await Promise.resolve().then(() => __importStar(require('./fiscalPeriod.service')))).default;
                await fiscalPeriodService.ensureCurrentYearPeriod(companyId);
            }
            catch (error) {
                logger_1.default.warn('Failed to auto-create fiscal period', {
                    companyId,
                    error: error?.message,
                });
            }
            return reactivated;
        }
        // Aucun abonnement → créer
        const subscription = await database_1.default.subscriptions.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                company_id: companyId,
                package_id: data.packageId,
                status: plan.status,
                billing_cycle: data.billingCycle,
                start_date: plan.startDate,
                end_date: plan.endDate,
                trial_ends_at: plan.trialEndsAt,
                next_payment_date: plan.endDate,
                updated_at: new Date(),
            },
            include: { packages: true },
        });
        logger_1.default.info(`Subscription created: ${subscription.id}`, {
            companyId,
            packageId: data.packageId,
            status: subscription.status,
        });
        try {
            const fiscalPeriodService = (await Promise.resolve().then(() => __importStar(require('./fiscalPeriod.service')))).default;
            await fiscalPeriodService.ensureCurrentYearPeriod(companyId);
        }
        catch (error) {
            logger_1.default.warn('Failed to auto-create fiscal period', {
                companyId,
                error: error?.message,
            });
        }
        return subscription;
    }
    // ────────────────────────────────────────────────
    // Changement de plan (upgrade/downgrade)
    // ────────────────────────────────────────────────
    /**
     * Changer de package.
     * Réinitialise les dates et le statut (trial pour payant, active pour gratuit).
     */
    async upgrade(companyId, newPackageId, userId) {
        // Récupérer l'abonnement (même expiré) via getActive qui retourne tout
        const subscription = await this.getActive(companyId);
        const oldPackage = subscription.packages;
        const newPackage = await package_service_1.default.getById(newPackageId);
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { id: true, name: true },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        // Calculer les nouvelles dates et le nouveau statut
        const plan = this.computePlanData(newPackage, {
            packageId: newPackageId,
            billingCycle: subscription.billing_cycle || 'monthly',
        });
        // Mettre à jour l'abonnement avec le nouveau plan ET nouvelles dates
        const updated = await database_1.default.subscriptions.update({
            where: { id: subscription.id },
            data: {
                package_id: newPackageId,
                status: plan.status,
                start_date: plan.startDate,
                end_date: plan.endDate,
                trial_ends_at: plan.trialEndsAt,
                next_payment_date: plan.endDate,
                cancelled_at: null,
                cancelled_by: null,
                updated_at: new Date(),
            },
            include: { packages: true },
        });
        logger_1.default.info(`Subscription upgraded: ${subscription.id}`, {
            companyId,
            oldPackageId: subscription.package_id,
            newPackageId,
            newStatus: updated.status,
            userId,
        });
        // Envoyer des emails de notification
        this.sendUpgradeEmails(companyId, company.name, oldPackage, newPackage, subscription, updated).catch((err) => {
            logger_1.default.error('Error sending subscription upgrade emails', { error: err.message, companyId });
        });
        return updated;
    }
    /**
     * Envoi asynchrone des emails d'upgrade (ne bloque pas la réponse).
     */
    async sendUpgradeEmails(companyId, companyName, oldPackage, newPackage, oldSubscription, newSubscription) {
        const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const oldFeatures = oldPackage?.features || {};
        const newFeaturesObj = newPackage.features || {};
        const newFeatures = [];
        const featureLabels = {
            expenses: 'Module Dépenses',
            accounting: 'Comptabilité Avancée',
            recurring_invoices: 'Factures Récurrentes',
            api: 'API Access',
            custom_templates: 'Templates Personnalisés',
            multi_currency: 'Multi-devises',
            advanced_reports: 'Rapports Avancés',
            workflows: 'Workflows Automatisés',
            custom_branding: 'Branding Personnalisé',
        };
        for (const [key, value] of Object.entries(newFeaturesObj)) {
            if (value === true && oldFeatures[key] !== true) {
                newFeatures.push(featureLabels[key] || key);
            }
        }
        const amount = Number(newPackage.price);
        const currency = newPackage.currency || 'CDF';
        const billingCycle = newSubscription.billing_cycle;
        const nextPaymentDate = newSubscription.next_payment_date
            ? new Date(newSubscription.next_payment_date).toLocaleDateString('fr-FR')
            : 'N/A';
        const usersToNotify = await database_1.default.users.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                OR: [{ role: 'admin' }, { role: 'accountant' }],
            },
            orderBy: { created_at: 'asc' },
            take: 10,
        });
        for (const user of usersToNotify) {
            try {
                await emailService.sendEmail({
                    from: process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '',
                    to: user.email,
                    subject: `Abonnement Mis à Jour - ${companyName}`,
                    template: 'subscription-upgraded',
                    data: {
                        firstName: user.first_name || 'Utilisateur',
                        companyName,
                        oldPackageName: oldPackage?.name || 'N/A',
                        newPackageName: newPackage.name,
                        billingCycle: billingCycle === 'monthly' ? 'Mensuel' : 'Annuel',
                        nextPaymentDate,
                        amount: amount.toLocaleString('fr-FR'),
                        currency,
                        newFeatures,
                        dashboardUrl: `${frontendUrl}/dashboard`,
                    },
                });
            }
            catch (error) {
                logger_1.default.error('Error sending subscription upgrade email', {
                    userId: user.id,
                    error: error.message,
                });
            }
        }
    }
    // ────────────────────────────────────────────────
    // Annulation
    // ────────────────────────────────────────────────
    /**
     * Annuler un abonnement (actif ou trial uniquement).
     */
    async cancel(companyId, userId) {
        const subscription = await this.getActive(companyId);
        if (subscription.status !== 'active' && subscription.status !== 'trial') {
            throw new error_middleware_1.CustomError('Seul un abonnement actif ou en essai peut être annulé.', 400, 'INVALID_STATUS');
        }
        const cancelled = await database_1.default.subscriptions.update({
            where: { id: subscription.id },
            data: {
                status: 'cancelled',
                cancelled_at: new Date(),
                cancelled_by: userId,
                updated_at: new Date(),
            },
            include: { packages: true },
        });
        logger_1.default.info(`Subscription cancelled: ${subscription.id}`, { companyId, userId });
        return cancelled;
    }
    // ────────────────────────────────────────────────
    // Renouvellement
    // ────────────────────────────────────────────────
    /**
     * Renouveler un abonnement (manuellement ou automatiquement).
     * Fonctionne pour les abonnements expired, cancelled, ou actifs arrivant à expiration.
     * Utilise findUnique directement (ne dépend PAS de getActive()).
     */
    async renew(companyId, automatic = false) {
        // Accès direct sans passer par getActive() pour pouvoir renouveler un expired
        const subscription = await database_1.default.subscriptions.findUnique({
            where: { company_id: companyId },
            include: { packages: true },
        });
        if (!subscription) {
            throw new error_middleware_1.CustomError('No subscription found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }
        // Renouvellement manuel : seulement si expired ou cancelled
        if (!automatic && subscription.status !== 'expired' && subscription.status !== 'cancelled') {
            throw new error_middleware_1.CustomError('L\'abonnement n\'est pas expiré ni annulé. Pas besoin de renouveler.', 400, 'INVALID_STATUS');
        }
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        const renewed = await database_1.default.subscriptions.update({
            where: { id: subscription.id },
            data: {
                status: 'active',
                start_date: now,
                end_date: endDate,
                trial_ends_at: null,
                next_payment_date: endDate,
                last_payment_date: now,
                cancelled_at: null,
                cancelled_by: null,
                updated_at: now,
            },
            include: { packages: true },
        });
        logger_1.default.info(`Subscription renewed: ${subscription.id}`, { companyId, automatic });
        // Envoyer des emails de notification (asynchrone)
        this.sendRenewalEmails(companyId, renewed, endDate, automatic).catch((err) => {
            logger_1.default.error('Error sending subscription renewal emails', { error: err.message, companyId });
        });
        return renewed;
    }
    /**
     * Envoi asynchrone des emails de renouvellement.
     */
    async sendRenewalEmails(companyId, renewed, endDate, automatic) {
        const company = await database_1.default.companies.findUnique({ where: { id: companyId } });
        if (!company)
            return;
        const usersToNotify = await database_1.default.users.findMany({
            where: {
                company_id: companyId,
                deleted_at: null,
                OR: [{ role: 'admin' }, { role: 'accountant' }],
            },
            orderBy: { created_at: 'asc' },
            take: 10,
        });
        const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const amount = Number(renewed.packages.price);
        const currency = renewed.packages.currency || 'CDF';
        const nextRenewalDate = new Date(endDate);
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        const now = renewed.start_date;
        for (const user of usersToNotify) {
            try {
                await emailService.sendEmail({
                    from: process.env.SMTP_NOTIF_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '',
                    to: user.email,
                    subject: automatic
                        ? `Abonnement Renouvelé Automatiquement - ${company.name}`
                        : `Abonnement Renouvelé - ${company.name}`,
                    template: 'subscription-renewed',
                    data: {
                        firstName: user.first_name || 'Utilisateur',
                        companyName: company.name,
                        packageName: renewed.packages.name,
                        periodStart: now.toLocaleDateString('fr-FR'),
                        periodEnd: endDate.toLocaleDateString('fr-FR'),
                        amount: amount.toLocaleString('fr-FR'),
                        currency,
                        nextRenewalDate: nextRenewalDate.toLocaleDateString('fr-FR'),
                        dashboardUrl: `${frontendUrl}/dashboard`,
                        automatic,
                    },
                });
            }
            catch (error) {
                logger_1.default.error('Error sending subscription renewal email', {
                    userId: user.id,
                    error: error.message,
                });
            }
        }
    }
    // ────────────────────────────────────────────────
    // Cron jobs
    // ────────────────────────────────────────────────
    /**
     * Expirer les essais dont trial_ends_at est dépassé.
     * À appeler par un cron job quotidien.
     */
    async expireTrials() {
        const now = new Date();
        const result = await database_1.default.subscriptions.updateMany({
            where: {
                status: 'trial',
                trial_ends_at: { lte: now },
            },
            data: {
                status: 'expired',
                updated_at: now,
            },
        });
        if (result.count > 0) {
            logger_1.default.info(`Expired ${result.count} trial subscription(s)`);
        }
        return { expired: result.count };
    }
    /**
     * Expirer les abonnements actifs dont end_date est dépassé.
     * À appeler par un cron job quotidien.
     */
    async expireSubscriptions() {
        const now = new Date();
        const result = await database_1.default.subscriptions.updateMany({
            where: {
                status: 'active',
                end_date: { lte: now },
            },
            data: {
                status: 'expired',
                updated_at: now,
            },
        });
        if (result.count > 0) {
            logger_1.default.info(`Expired ${result.count} active subscription(s)`);
        }
        return { expired: result.count };
    }
    /**
     * Obtenir le package actif d'une entreprise.
     */
    async getActivePackage(companyId) {
        const subscription = await this.getActive(companyId);
        return subscription.packages;
    }
}
exports.SubscriptionService = SubscriptionService;
exports.default = new SubscriptionService();
//# sourceMappingURL=subscription.service.js.map