"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCompanyCache = exports.invalidateQuotaCache = exports.invalidateDashboardCache = exports.invalidateCache = void 0;
const cache_service_1 = __importDefault(require("../services/cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware pour invalider le cache après une mutation réussie
 * @param patterns Patterns de clés à invalider (peut contenir :companyId comme placeholder)
 */
const invalidateCache = (...patterns) => {
    return async (req, res, next) => {
        // Sauvegarder la fonction send originale
        const originalSend = res.send.bind(res);
        // Intercepter la réponse
        res.send = function (body) {
            // Si la requête a réussi (status < 400)
            if (res.statusCode < 400) {
                const companyId = req.user?.companyId;
                if (companyId) {
                    // Remplacer :companyId par l'ID réel et invalider
                    patterns.forEach((pattern) => {
                        const cachePattern = pattern.replace(':companyId', companyId);
                        cache_service_1.default.deletePattern(cachePattern).catch((err) => {
                            logger_1.default.error(`Error invalidating cache pattern ${cachePattern}:`, err);
                        });
                    });
                    logger_1.default.debug(`Cache invalidated for company ${companyId}`, { patterns });
                }
            }
            // Appeler la fonction send originale
            return originalSend(body);
        };
        next();
    };
};
exports.invalidateCache = invalidateCache;
/**
 * Middleware pour invalider le cache du dashboard spécifiquement
 */
exports.invalidateDashboardCache = (0, exports.invalidateCache)('dashboard:stats::companyId:*');
/**
 * Middleware pour invalider le cache des quotas
 */
exports.invalidateQuotaCache = (0, exports.invalidateCache)('quota:summary::companyId', 'package:features::companyId', 'package:limits::companyId');
/**
 * Middleware pour invalider tout le cache d'une entreprise
 */
const invalidateCompanyCache = async (req, res, next) => {
    const originalSend = res.send.bind(res);
    res.send = function (body) {
        if (res.statusCode < 400) {
            const companyId = req.user?.companyId;
            if (companyId) {
                cache_service_1.default.invalidateCompany(companyId).catch((err) => {
                    logger_1.default.error(`Error invalidating company cache for ${companyId}:`, err);
                });
                logger_1.default.debug(`All cache invalidated for company ${companyId}`);
            }
        }
        return originalSend(body);
    };
    next();
};
exports.invalidateCompanyCache = invalidateCompanyCache;
//# sourceMappingURL=cache-invalidation.middleware.js.map