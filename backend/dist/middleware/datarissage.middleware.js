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
exports.requireModuleEnabled = exports.requireDatarissageCompleted = exports.preventLockedField = void 0;
const datarissage_service_1 = __importDefault(require("../services/datarissage.service"));
const error_middleware_1 = require("./error.middleware");
/**
 * Middleware pour empêcher la modification des éléments verrouillés après datarissage
 *
 * Utilisation:
 * router.put('/company',
 *   authMiddleware.authenticate,
 *   datarissageMiddleware.preventLockedField('currency', 'businessType'),
 *   companyController.update
 * );
 */
const preventLockedField = (...fields) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.companyId) {
                return next(new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
            }
            // Vérifier chaque champ
            for (const field of fields) {
                const isLocked = await datarissage_service_1.default.isFieldLocked(req.user.companyId, field);
                if (isLocked && req.body[field] !== undefined) {
                    // Le champ est verrouillé et l'utilisateur essaie de le modifier
                    return next(new error_middleware_1.CustomError(`Le champ "${field}" est verrouillé après le datarissage et ne peut pas être modifié. Contactez le support pour une modification.`, 403, 'FIELD_LOCKED'));
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.preventLockedField = preventLockedField;
/**
 * Middleware pour vérifier que le datarissage est complété avant d'accéder à certaines routes
 */
const requireDatarissageCompleted = async (req, res, next) => {
    try {
        if (!req.user || !req.user.companyId) {
            return next(new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
        }
        const isCompleted = await datarissage_service_1.default.isCompleted(req.user.companyId);
        if (!isCompleted) {
            return next(new error_middleware_1.CustomError('Le datarissage doit être complété avant d\'accéder à cette fonctionnalité', 403, 'DATARISSAGE_NOT_COMPLETED'));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireDatarissageCompleted = requireDatarissageCompleted;
/**
 * Middleware pour vérifier qu'un module est activé
 */
const requireModuleEnabled = (module) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.companyId) {
                return next(new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
            }
            const prisma = (await Promise.resolve().then(() => __importStar(require('../config/database')))).default;
            const company = await prisma.companies.findUnique({
                where: { id: req.user.companyId },
                select: {
                    module_facturation_enabled: true,
                    module_comptabilite_enabled: true,
                    module_stock_enabled: true,
                    module_rh_enabled: true,
                },
            });
            if (!company) {
                return next(new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND'));
            }
            const moduleFieldMap = {
                facturation: 'module_facturation_enabled',
                comptabilite: 'module_comptabilite_enabled',
                stock: 'module_stock_enabled',
                rh: 'module_rh_enabled',
            };
            const isEnabled = company[moduleFieldMap[module]];
            if (!isEnabled) {
                return next(new error_middleware_1.CustomError(`Le module ${module} n'est pas activé. Activez-le dans les paramètres du datarissage.`, 403, 'MODULE_NOT_ENABLED'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireModuleEnabled = requireModuleEnabled;
//# sourceMappingURL=datarissage.middleware.js.map