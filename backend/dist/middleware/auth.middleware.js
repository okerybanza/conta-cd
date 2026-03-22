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
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireCompany = requireCompany;
exports.getCompanyId = getCompanyId;
exports.getUserId = getUserId;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("./error.middleware");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.CustomError('No token provided', 401, 'NO_TOKEN');
        }
        const token = authHeader.substring(7);
        // Vérifier token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
        // SPRINT 5 - TASK 5.3 (SCALE-002): Session Scalability / Revocation
        if (decoded.jti) {
            const { default: revocationService } = await Promise.resolve().then(() => __importStar(require('../services/auth/revocation.service')));
            const isRevoked = await revocationService.isRevoked(decoded.jti);
            if (isRevoked) {
                throw new error_middleware_1.CustomError('Session has been revoked or expired', 401, 'SESSION_REVOKED');
            }
        }
        // Vérifier utilisateur existe et actif
        const user = await database_1.default.users.findFirst({
            where: {
                id: decoded.userId,
                email: decoded.email,
                deleted_at: null, // snake_case dans where
            },
            select: {
                id: true,
                email: true,
                company_id: true, // snake_case dans select
                role: true,
                locked_until: true, // snake_case dans select
                is_super_admin: true, // snake_case dans select
                is_conta_user: true, // snake_case dans select
            },
        });
        if (!user) {
            throw new error_middleware_1.CustomError('User not found', 401, 'USER_NOT_FOUND');
        }
        // Vérifier compte non verrouillé
        if (user.locked_until && user.locked_until > new Date()) {
            throw new error_middleware_1.CustomError('Account is locked', 403, 'ACCOUNT_LOCKED');
        }
        // Ajouter user à la requête
        req.user = {
            id: user.id,
            email: user.email,
            companyId: user.company_id ?? null, // snake_case dans le résultat
            role: user.role || 'manager',
            isSuperAdmin: user.is_super_admin || false, // snake_case dans le résultat
            isContaUser: user.is_conta_user || false, // snake_case dans le résultat
        };
        next();
    }
    catch (error) {
        if (error instanceof error_middleware_1.CustomError) {
            return next(error);
        }
        next(new error_middleware_1.CustomError('Invalid token', 401, 'INVALID_TOKEN'));
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_middleware_1.CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
        }
        next();
    };
}
function requireCompany(req, res, next) {
    if (!req.user) {
        return next(new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    // Middleware pour s'assurer que l'utilisateur accède uniquement aux données de son entreprise
    // Sera utilisé dans les controllers pour filtrer les requêtes
    next();
}
/**
 * Fonction utilitaire pour obtenir le companyId de manière sûre
 * Lance une erreur si companyId est null (utilisateurs sans entreprise)
 */
function getCompanyId(req) {
    if (!req.user) {
        throw new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    if (!req.user.companyId) {
        throw new error_middleware_1.CustomError('Company ID required', 400, 'COMPANY_ID_REQUIRED');
    }
    return req.user.companyId;
}
function getUserId(req) {
    if (!req.user) {
        throw new error_middleware_1.CustomError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    if (!req.user.id) {
        throw new error_middleware_1.CustomError('User ID required', 400, 'USER_ID_REQUIRED');
    }
    return req.user.id;
}
//# sourceMappingURL=auth.middleware.js.map