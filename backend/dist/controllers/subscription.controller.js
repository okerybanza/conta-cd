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
exports.SubscriptionController = void 0;
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
/**
 * Mapper les données Prisma (snake_case) vers camelCase pour le frontend.
 */
function mapSubscriptionToFrontend(subscription) {
    const pkg = subscription.packages;
    const packageObj = pkg
        ? {
            id: pkg.id,
            code: pkg.code,
            name: pkg.name,
            description: pkg.description || undefined,
            priceMonthly: Number(pkg.price || 0),
            priceYearly: pkg.billing_cycle === 'yearly' ? Number(pkg.price || 0) : Number(pkg.price || 0) * 10,
            currency: pkg.currency || 'CDF',
            limits: pkg.limits || {},
            features: pkg.features || {},
            isActive: pkg.is_active !== undefined ? pkg.is_active : true,
            displayOrder: pkg.display_order || 0,
        }
        : undefined;
    return {
        id: subscription.id,
        companyId: subscription.company_id,
        packageId: subscription.package_id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        startDate: subscription.start_date ? subscription.start_date.toISOString() : new Date().toISOString(),
        endDate: subscription.end_date ? subscription.end_date.toISOString() : undefined,
        trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : undefined,
        cancelledAt: subscription.cancelled_at ? subscription.cancelled_at.toISOString() : undefined,
        cancelledBy: subscription.cancelled_by || undefined,
        paymentMethod: subscription.payment_method || undefined,
        lastPaymentDate: subscription.last_payment_date ? subscription.last_payment_date.toISOString() : undefined,
        nextPaymentDate: subscription.next_payment_date ? subscription.next_payment_date.toISOString() : undefined,
        package: packageObj,
    };
}
const createSubscriptionSchema = zod_1.z.object({
    packageId: zod_1.z.string().uuid(),
    billingCycle: zod_1.z.enum(['monthly', 'yearly']),
    startDate: zod_1.z.string().datetime().optional(),
    trialDays: zod_1.z.number().int().positive().max(30).optional(),
});
class SubscriptionController {
    /**
     * GET /api/v1/subscription
     * Obtenir l'abonnement de l'entreprise (quel que soit son statut).
     */
    async getActive(req, res, next) {
        try {
            const subscription = await subscription_service_1.default.getActive((0, auth_middleware_1.getCompanyId)(req));
            res.json({
                success: true,
                data: mapSubscriptionToFrontend(subscription),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/subscription
     * Créer (ou réactiver) un abonnement.
     */
    async create(req, res, next) {
        try {
            const data = createSubscriptionSchema.parse(req.body);
            const subscription = await subscription_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
            });
            res.status(201).json({
                success: true,
                data: mapSubscriptionToFrontend(subscription),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/v1/subscription/upgrade
     * Changer de package (upgrade / downgrade).
     */
    async upgrade(req, res, next) {
        try {
            const { packageId } = req.body;
            if (!packageId || typeof packageId !== 'string') {
                throw new error_middleware_1.CustomError('packageId is required', 400, 'VALIDATION_ERROR');
            }
            const subscription = await subscription_service_1.default.upgrade((0, auth_middleware_1.getCompanyId)(req), packageId, req.user.id);
            res.json({
                success: true,
                data: mapSubscriptionToFrontend(subscription),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/subscription/cancel
     * Annuler un abonnement.
     */
    async cancel(req, res, next) {
        try {
            const subscription = await subscription_service_1.default.cancel((0, auth_middleware_1.getCompanyId)(req), req.user.id);
            res.json({
                success: true,
                data: mapSubscriptionToFrontend(subscription),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/subscription/renew
     * Renouveler un abonnement expiré ou annulé.
     */
    async renew(req, res, next) {
        try {
            const automatic = req.body.automatic === true;
            const subscription = await subscription_service_1.default.renew((0, auth_middleware_1.getCompanyId)(req), automatic);
            res.json({
                success: true,
                data: mapSubscriptionToFrontend(subscription),
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/subscription/quota-summary
     * Résumé des quotas et fonctionnalités.
     */
    async getQuotaSummary(req, res, next) {
        try {
            const quotaService = (await Promise.resolve().then(() => __importStar(require('../services/quota.service')))).default;
            const summary = await quotaService.getQuotaSummary((0, auth_middleware_1.getCompanyId)(req));
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubscriptionController = SubscriptionController;
exports.default = new SubscriptionController();
//# sourceMappingURL=subscription.controller.js.map