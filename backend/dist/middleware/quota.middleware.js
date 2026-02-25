"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkQuota = checkQuota;
exports.requireFeature = requireFeature;
const quota_service_1 = __importDefault(require("../services/quota.service"));
const auth_middleware_1 = require("./auth.middleware");
/**
 * Middleware pour vérifier une limite de quota
 * Lance une erreur 403 si la limite est atteinte
 */
function checkQuota(metric) {
    return async (req, res, next) => {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await quota_service_1.default.checkLimit(companyId, metric);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * Lance une erreur 403 si la fonctionnalité n'est pas disponible
 */
function requireFeature(feature) {
    return async (req, res, next) => {
        try {
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await quota_service_1.default.requireFeature(companyId, feature);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=quota.middleware.js.map