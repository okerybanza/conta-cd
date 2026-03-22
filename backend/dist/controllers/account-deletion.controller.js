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
exports.AccountDeletionController = void 0;
const account_deletion_service_1 = __importDefault(require("../services/account-deletion.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const deleteAccountSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
    anonymizeImmediately: zod_1.z.boolean().optional(),
});
const restoreAccountSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    newPassword: zod_1.z.string().min(8).optional(),
});
class AccountDeletionController {
    /**
     * DELETE /api/v1/account/delete
     * Supprimer son propre compte ou un compte utilisateur (admin)
     */
    async deleteAccount(req, res, next) {
        try {
            const userId = req.params.userId || req.user.id; // Permettre de supprimer un autre utilisateur si admin
            const deleterId = req.user.id;
            // Si on essaie de supprimer un autre utilisateur, vérifier les permissions
            if (userId !== deleterId) {
                const companyId = (0, auth_middleware_1.getCompanyId)(req);
                if (!companyId) {
                    throw new error_middleware_1.CustomError('Company ID required', 400, 'COMPANY_ID_REQUIRED');
                }
                // Vérifier que l'utilisateur est admin de l'entreprise
                const userService = (await Promise.resolve().then(() => __importStar(require('../services/user.service')))).default;
                const user = await userService.getUserById(companyId, deleterId);
                if (user.role !== 'admin') {
                    throw new error_middleware_1.CustomError('Seuls les administrateurs peuvent supprimer d\'autres comptes', 403, 'INSUFFICIENT_PERMISSIONS');
                }
            }
            const validated = deleteAccountSchema.parse(req.body);
            const result = await account_deletion_service_1.default.deleteAccount(userId, deleterId, {
                reason: validated.reason,
                anonymizeImmediately: validated.anonymizeImmediately || false,
            });
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/account/restore
     * Restaurer un compte supprimé (pendant la période de grâce)
     */
    async restoreAccount(req, res, next) {
        try {
            const validated = restoreAccountSchema.parse(req.body);
            const result = await account_deletion_service_1.default.restoreAccount(validated.email, validated.newPassword);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/account/deleted-info
     * Obtenir les informations sur un compte supprimé
     */
    async getDeletedAccountInfo(req, res, next) {
        try {
            const email = req.query.email;
            if (!email) {
                throw new error_middleware_1.CustomError('Email parameter is required', 400, 'EMAIL_REQUIRED');
            }
            const info = await account_deletion_service_1.default.getDeletedAccountInfo(email);
            res.json({
                success: true,
                data: info,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/account/check-email
     * Vérifier si un email peut être réutilisé (pour l'inscription)
     */
    async checkEmailReusability(req, res, next) {
        try {
            const email = req.body.email;
            if (!email || typeof email !== 'string') {
                throw new error_middleware_1.CustomError('Email is required', 400, 'EMAIL_REQUIRED');
            }
            const result = await account_deletion_service_1.default.canReuseEmail(email);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccountDeletionController = AccountDeletionController;
exports.default = new AccountDeletionController();
//# sourceMappingURL=account-deletion.controller.js.map