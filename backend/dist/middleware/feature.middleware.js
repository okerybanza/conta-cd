"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeature = requireFeature;
const auth_middleware_1 = require("./auth.middleware");
const quota_service_1 = __importDefault(require("../services/quota.service"));
/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * (wrapper mince autour de quotaService.requireFeature)
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
exports.default = requireFeature;
//# sourceMappingURL=feature.middleware.js.map