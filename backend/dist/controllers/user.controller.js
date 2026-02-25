"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_service_1 = __importDefault(require("../services/user.service"));
const env_1 = __importDefault(require("../config/env"));
const zod_1 = require("zod");
const inviteUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
});
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
});
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee', 'rh']).optional(),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
    lockedUntil: zod_1.z.date().nullable().optional(),
});
const resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
});
class UserController {
    /**
     * Inviter un utilisateur par email
     */
    async invite(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = inviteUserSchema.parse(req.body);
            const user = await user_service_1.default.inviteUser((0, auth_middleware_1.getCompanyId)(req), req.user.id, data);
            res.status(201).json({
                success: true,
                data: user,
                message: 'Invitation envoyée avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Créer un utilisateur directement
     */
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createUserSchema.parse(req.body);
            const user = await user_service_1.default.createUser((0, auth_middleware_1.getCompanyId)(req), req.user.id, data);
            res.status(201).json({
                success: true,
                data: user,
                message: 'Utilisateur créé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Lister les utilisateurs de l'entreprise
     */
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                role: req.query.role,
                search: req.query.search,
            };
            const users = await user_service_1.default.listUsers((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtenir un utilisateur par ID
     */
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const user = await user_service_1.default.getUserById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mettre à jour un utilisateur
     */
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const data = updateUserSchema.parse(req.body);
            const user = await user_service_1.default.updateUser((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, data);
            res.json({
                success: true,
                data: user,
                message: 'Utilisateur mis à jour avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Supprimer un utilisateur
     */
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            await user_service_1.default.deleteUser((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json({
                success: true,
                message: 'Utilisateur supprimé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Réinitialiser le mot de passe d'un utilisateur
     */
    async resetPassword(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const { newPassword } = resetPasswordSchema.parse(req.body);
            await user_service_1.default.resetUserPassword((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, newPassword);
            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Upload avatar de l'utilisateur connecté (POST /users/me/avatar)
     */
    async uploadAvatar(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            if (!req.file)
                throw new Error('No file uploaded');
            const baseUrl = process.env.BACKEND_URL || env_1.default.FRONTEND_URL || (req.protocol + '://' + req.get('host'));
            const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
            await user_service_1.default.updateAvatarUrl(req.user.id, avatarUrl);
            res.json({
                success: true,
                data: { avatarUrl },
                message: 'Photo de profil mise à jour',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map