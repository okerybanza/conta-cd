"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireContaUser = requireContaUser;
exports.isSuperAdmin = isSuperAdmin;
exports.isContaUser = isContaUser;
const CustomError_1 = __importDefault(require("../utils/CustomError"));
const database_1 = __importDefault(require("../config/database"));
/**
 * Middleware pour vérifier que l'utilisateur est Super Admin
 */
function requireSuperAdmin() {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new CustomError_1.default('User not authenticated', 401, 'NOT_AUTHENTICATED');
            }
            // Vérifier que l'utilisateur est Super Admin
            const user = await database_1.default.users.findFirst({
                where: {
                    id: req.user.id,
                    deleted_at: null,
                },
                select: {
                    is_super_admin: true,
                },
            });
            if (!user || !user.is_super_admin) {
                throw new CustomError_1.default('Super Admin access required', 403, 'SUPER_ADMIN_REQUIRED');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware pour vérifier que l'utilisateur est un utilisateur Conta (interne)
 */
function requireContaUser(allowedRoles) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new CustomError_1.default('User not authenticated', 401, 'NOT_AUTHENTICATED');
            }
            // Vérifier que l'utilisateur est un utilisateur Conta
            const user = await database_1.default.users.findFirst({
                where: {
                    id: req.user.id,
                    deleted_at: null,
                },
                select: {
                    is_conta_user: true,
                    is_super_admin: true,
                    conta_role: true,
                },
            });
            // Super Admin a toujours accès
            if (user?.is_super_admin) {
                return next();
            }
            if (!user || !user.is_conta_user) {
                throw new CustomError_1.default('Conta user access required', 403, 'CONTA_USER_REQUIRED');
            }
            // Vérifier le rôle si spécifié
            if (allowedRoles && allowedRoles.length > 0) {
                if (!user.conta_role || !allowedRoles.includes(user.conta_role)) {
                    throw new CustomError_1.default('Insufficient permissions for this role', 403, 'INSUFFICIENT_ROLE_PERMISSIONS');
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Vérifier si un utilisateur est Super Admin (utilitaire)
 */
async function isSuperAdmin(userId) {
    const user = await database_1.default.users.findFirst({
        where: {
            id: userId,
            deleted_at: null,
        },
        select: {
            is_super_admin: true,
        },
    });
    return user?.is_super_admin || false;
}
/**
 * Vérifier si un utilisateur est un utilisateur Conta (utilitaire)
 */
async function isContaUser(userId) {
    const user = await database_1.default.users.findFirst({
        where: {
            id: userId,
            deleted_at: null,
        },
        select: {
            is_conta_user: true,
            is_super_admin: true,
        },
    });
    return user?.is_conta_user || false || user?.is_super_admin || false;
}
//# sourceMappingURL=superadmin.middleware.js.map