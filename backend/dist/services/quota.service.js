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
exports.QuotaService = void 0;
const subscription_service_1 = __importDefault(require("./subscription.service"));
const package_service_1 = __importDefault(require("./package.service"));
const usage_service_1 = __importDefault(require("./usage.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class QuotaService {
    /**
     * Obtenir la limite d'une métrique pour une entreprise
     */
    async getLimit(companyId, metric) {
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            // Mapper les métriques UsageMetric vers PackageLimits
            // SMS désactivé - ne garder que Email et WhatsApp
            const packageMetric = metric === 'emails_sent' ? 'emails_per_month'
                // : metric === 'sms_sent' ? 'sms_per_month' // SMS désactivé
                : metric;
            const limit = await package_service_1.default.getLimit(subscription.package_id, packageMetric);
            return limit;
        }
        catch (error) {
            // Si pas d'abonnement, retourner null (illimité par défaut pour compatibilité)
            logger_1.default.warn(`No subscription found for company ${companyId}, returning null limit`);
            return null;
        }
    }
    /**
     * Vérifier si une limite est atteinte
     */
    async isLimitReached(companyId, metric) {
        const limit = await this.getLimit(companyId, metric);
        if (limit === null) {
            return false; // Illimité
        }
        const currentUsage = await usage_service_1.default.get(companyId, metric);
        return currentUsage >= limit;
    }
    /**
     * Vérifier si une entreprise peut créer une ressource (vérifie la limite)
     */
    async canCreate(companyId, metric) {
        return !(await this.isLimitReached(companyId, metric));
    }
    /**
     * Vérifier une limite et lancer une erreur si atteinte
     */
    async checkLimit(companyId, metric) {
        if (await this.isLimitReached(companyId, metric)) {
            const limit = await this.getLimit(companyId, metric);
            const currentUsage = await usage_service_1.default.get(companyId, metric);
            throw new error_middleware_1.CustomError(`Limit reached for ${metric}. Current: ${currentUsage}/${limit}. Please upgrade your plan.`, 403, 'QUOTA_EXCEEDED', {
                metric,
                limit,
                currentUsage,
            });
        }
    }
    /**
     * Vérifier si une fonctionnalité est disponible
     */
    async checkFeature(companyId, feature) {
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            return await package_service_1.default.hasFeature(subscription.package_id, feature);
        }
        catch (error) {
            // Si pas d'abonnement, retourner false (fonctionnalité non disponible)
            return false;
        }
    }
    /**
     * Vérifier une fonctionnalité et lancer une erreur si non disponible
     */
    async requireFeature(companyId, feature) {
        const hasFeature = await this.checkFeature(companyId, feature);
        if (!hasFeature) {
            throw new error_middleware_1.CustomError(`Feature "${feature}" is not available in your plan. Please upgrade to access this feature.`, 403, 'FEATURE_NOT_AVAILABLE', { feature });
        }
    }
    /**
     * Obtenir toutes les limites d'une entreprise
     */
    async getAllLimits(companyId) {
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            const limits = await package_service_1.default.getLimits(subscription.package_id);
            // Récupérer l'usage de stockage actuel
            const storageService = (await Promise.resolve().then(() => __importStar(require('./storage.service')))).default;
            const storageUsage = await storageService.calculateStorageUsage(companyId);
            const storageLimitBytes = limits.storage_mb ? limits.storage_mb * 1024 * 1024 : null;
            return {
                customers: limits.customers ?? null,
                products: limits.products ?? null,
                users: limits.users ?? null,
                emails_sent: limits.emails_per_month ?? null,
                // sms_sent: limits.sms_per_month ?? null, // SMS désactivé
                whatsapp_sent: null, // WhatsApp n'a pas de limite spécifique pour l'instant
                suppliers: limits.suppliers ?? null,
                expenses: limits.expenses ?? null,
                invoices: limits.invoices ?? null,
                recurring_invoices: limits.recurring_invoices ?? null,
                storage: storageLimitBytes,
            };
        }
        catch (error) {
            // Retourner toutes les limites à null (illimité) si pas d'abonnement
            return {
                customers: null,
                products: null,
                users: null,
                emails_sent: null,
                // sms_sent: null, // SMS désactivé
                whatsapp_sent: null,
                suppliers: null,
                expenses: null,
                invoices: null,
                recurring_invoices: null,
                storage: null,
            };
        }
    }
    /**
     * Obtenir toutes les fonctionnalités d'une entreprise
     */
    async getAllFeatures(companyId) {
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            const features = await package_service_1.default.getFeatures(subscription.package_id);
            return {
                expenses: features.expenses ?? false,
                accounting: features.accounting ?? false,
                recurring_invoices: features.recurring_invoices ?? false,
                api: features.api ?? false,
                custom_templates: features.custom_templates ?? false,
                multi_currency: features.multi_currency ?? false,
                advanced_reports: features.advanced_reports ?? false,
                workflows: features.workflows ?? false,
                custom_branding: features.custom_branding ?? false,
                stock: features.stock ?? false,
                hr: features.hr ?? false,
            };
        }
        catch (error) {
            // Retourner toutes les fonctionnalités à false si pas d'abonnement
            return {
                expenses: false,
                accounting: false,
                recurring_invoices: false,
                api: false,
                custom_templates: false,
                multi_currency: false,
                advanced_reports: false,
                workflows: false,
                custom_branding: false,
                stock: false,
                hr: false,
            };
        }
    }
    /**
     * Obtenir le résumé des quotas (limites et usage actuel)
     */
    async getQuotaSummary(companyId) {
        const limits = await this.getAllLimits(companyId);
        const usage = await usage_service_1.default.getAll(companyId);
        const features = await this.getAllFeatures(companyId);
        // Récupérer l'abonnement actuel
        let currentPackage = null;
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            currentPackage = {
                id: subscription.id,
                name: subscription.packages.name,
                code: subscription.packages.code,
                billingCycle: subscription.billing_cycle,
                status: subscription.status,
                startDate: subscription.start_date.toISOString(),
                endDate: subscription.end_date ? subscription.end_date.toISOString() : null,
                trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : null,
            };
        }
        catch (error) {
            // Pas d'abonnement actif, currentPackage reste null
            logger_1.default.warn(`No active subscription found for company ${companyId}`);
        }
        return {
            limits,
            usage,
            features,
            currentPackage,
        };
    }
}
exports.QuotaService = QuotaService;
exports.default = new QuotaService();
//# sourceMappingURL=quota.service.js.map