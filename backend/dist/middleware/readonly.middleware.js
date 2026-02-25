"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = requireActiveSubscription;
exports.isReadOnlyMode = isReadOnlyMode;
const error_middleware_1 = require("./error.middleware");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware pour bloquer les actions d'écriture si l'abonnement est expiré.
 * Permet la lecture mais bloque création/édition/suppression.
 *
 * À appliquer sur les routes POST/PUT/PATCH/DELETE des modules métier.
 * Les routes GET restent accessibles même si l'abonnement est expiré.
 */
async function requireActiveSubscription(req, res, next) {
    try {
        // Si pas d'utilisateur authentifié, laisser passer (authenticate middleware gère ça)
        if (!req.user) {
            return next();
        }
        // Si Super Admin ou utilisateur Conta, laisser passer
        if (req.user.isSuperAdmin || req.user.isContaUser) {
            return next();
        }
        // Si pas de companyId (ex: expert comptable sans entreprise), laisser passer
        if (!req.user.companyId) {
            return next();
        }
        const companyId = req.user.companyId;
        try {
            // getActive() retourne toujours l'abonnement (même expiré)
            // et applique automatiquement les transitions trial→expired, active→expired.
            const subscription = await subscription_service_1.default.getActive(companyId);
            // Abonnement actif ou trial → laisser passer
            if (subscription.status === 'active' || subscription.status === 'trial') {
                return next();
            }
            // Abonnement expired ou cancelled → bloquer les écritures
            return next(new error_middleware_1.CustomError('Votre abonnement est expiré. Vous pouvez consulter vos données mais vous devez renouveler votre abonnement pour continuer à créer ou modifier.', 403, 'SUBSCRIPTION_EXPIRED_READ_ONLY', {
                subscriptionStatus: subscription.status,
                endDate: subscription.end_date?.toISOString(),
            }));
        }
        catch (error) {
            // SUBSCRIPTION_NOT_FOUND → pas d'abonnement du tout, bloquer aussi
            if (error.code === 'SUBSCRIPTION_NOT_FOUND') {
                return next(new error_middleware_1.CustomError('Aucun abonnement actif trouvé. Vous devez souscrire à un plan pour utiliser cette fonctionnalité.', 403, 'SUBSCRIPTION_REQUIRED'));
            }
            // Autre erreur inattendue → logger et laisser passer (ne pas bloquer)
            logger_1.default.warn('Error checking subscription in readonly middleware', {
                companyId,
                error: error.message,
                code: error.code,
            });
            return next();
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * Helper pour vérifier si une entreprise est en mode lecture seule.
 * Utile dans les services pour des vérifications conditionnelles.
 */
async function isReadOnlyMode(companyId) {
    try {
        const subscription = await subscription_service_1.default.getActive(companyId);
        return subscription.status === 'expired' || subscription.status === 'cancelled';
    }
    catch (error) {
        if (error.code === 'SUBSCRIPTION_NOT_FOUND') {
            // Pas d'abonnement du tout → considérer comme readonly
            return true;
        }
        // Erreur inattendue → pas readonly par défaut
        return false;
    }
}
//# sourceMappingURL=readonly.middleware.js.map