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
exports.UserService = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("../config/env"));
const email_service_1 = __importDefault(require("./email.service"));
const crypto_1 = require("crypto");
// Schémas de validation
const inviteUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee']),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
});
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee']),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
});
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'accountant', 'manager', 'employee']).optional(),
    permissions: zod_1.z.record(zod_1.z.any()).optional(),
    lockedUntil: zod_1.z.date().nullable().optional(),
});
class UserService {
    /**
     * Inviter un utilisateur par email
     */
    async inviteUser(companyId, inviterId, data) {
        // Vérifier le quota d'utilisateurs AVANT toute autre vérification
        const quotaService = (await Promise.resolve().then(() => __importStar(require('./quota.service')))).default;
        try {
            await quotaService.checkLimit(companyId, 'users');
        }
        catch (error) {
            // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
            throw error;
        }
        const validated = inviteUserSchema.parse(data);
        // Vérifier que l'email n'existe pas déjà
        const existingUser = await database_1.default.users.findUnique({
            where: { email: validated.email },
        });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        // Vérifier que l'inviteur est admin
        const inviter = await database_1.default.users.findUnique({
            where: { id: inviterId },
        });
        if (!inviter || inviter.role !== 'admin') {
            throw new Error('Seuls les administrateurs peuvent inviter des utilisateurs');
        }
        // Générer un token d'invitation
        const invitationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const invitationExpires = new Date();
        invitationExpires.setDate(invitationExpires.getDate() + 7); // Valide 7 jours
        // Créer l'utilisateur avec un mot de passe temporaire
        const tempPassword = (0, crypto_1.randomBytes)(16).toString('hex');
        const passwordHash = await bcrypt_1.default.hash(tempPassword, parseInt(env_1.default.BCRYPT_ROUNDS));
        const user = await database_1.default.users.create({
            data: {
                email: validated.email,
                password_hash: passwordHash,
                first_name: validated.firstName,
                last_name: validated.lastName,
                company_id: companyId,
                role: validated.role,
                permissions: validated.permissions || {},
                id: (0, crypto_1.randomUUID)(),
                email_verified: false,
                email_verification_token: invitationToken,
                email_verification_expires_at: invitationExpires,
                updated_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                created_at: true,
            },
        });
        // Envoyer l'email d'invitation
        try {
            const invitationUrl = `${env_1.default.FRONTEND_URL}/auth/accept-invitation?token=${invitationToken}`;
            await email_service_1.default.sendEmail({
                from: env_1.default.SMTP_FROM || env_1.default.SMTP_USER,
                to: validated.email,
                subject: 'Invitation à rejoindre Conta',
                template: 'user-invitation',
                data: {
                    firstName: validated.firstName || 'Utilisateur',
                    inviterName: `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email,
                    invitationUrl,
                    companyName: (await database_1.default.companies.findUnique({ where: { id: companyId } }))?.name || 'l\'entreprise',
                },
            });
            logger_1.default.info('Invitation email sent successfully', { email: validated.email });
        }
        catch (error) {
            logger_1.default.error('Failed to send invitation email', {
                email: validated.email,
                error: error.message,
            });
            // Ne pas échouer la création de l'utilisateur si l'email ne peut pas être envoyé
            // L'utilisateur pourra toujours utiliser la réinitialisation de mot de passe
        }
        // Incrémenter le compteur d'usage APRÈS création réussie
        const usageService = (await Promise.resolve().then(() => __importStar(require('./usage.service')))).default;
        await usageService.increment(companyId, 'users');
        logger_1.default.info('User invited', { userId: user.id, email: validated.email, companyId });
        return user;
    }
    /**
     * Créer un utilisateur directement (avec mot de passe)
     */
    async createUser(companyId, creatorId, data) {
        const validated = createUserSchema.parse(data);
        // Vérifier le quota d'utilisateurs AVANT toute autre vérification
        const quotaService = (await Promise.resolve().then(() => __importStar(require('./quota.service')))).default;
        try {
            await quotaService.checkLimit(companyId, 'users');
        }
        catch (error) {
            // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
            throw error;
        }
        // Vérifier que l'email n'existe pas déjà
        const existingUser = await database_1.default.users.findUnique({
            where: { email: validated.email },
        });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        // Vérifier que le créateur est admin
        const creator = await database_1.default.users.findUnique({
            where: { id: creatorId },
        });
        if (!creator || creator.role !== 'admin') {
            throw new Error('Seuls les administrateurs peuvent créer des utilisateurs');
        }
        // Hasher le mot de passe
        const passwordHash = await bcrypt_1.default.hash(validated.password, parseInt(env_1.default.BCRYPT_ROUNDS));
        const user = await database_1.default.users.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                email: validated.email,
                password_hash: passwordHash,
                first_name: validated.firstName,
                last_name: validated.lastName,
                phone: validated.phone,
                company_id: companyId,
                role: validated.role,
                permissions: validated.permissions || {},
                email_verified: true, // Créé directement, donc vérifié
                updated_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                role: true,
                permissions: true,
                created_at: true,
                last_login_at: true,
            },
        });
        // Incrémenter le compteur d'usage APRÈS création réussie
        const usageService = (await Promise.resolve().then(() => __importStar(require('./usage.service')))).default;
        await usageService.increment(companyId, 'users');
        logger_1.default.info('User created', { userId: user.id, email: validated.email, companyId });
        return user;
    }
    /**
     * Lister les utilisateurs d'une entreprise
     */
    async listUsers(companyId, filters) {
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { first_name: { contains: filters.search, mode: 'insensitive' } },
                { last_name: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const users = await database_1.default.users.findMany({
            where,
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                role: true,
                permissions: true,
                email_verified: true,
                two_factor_enabled: true,
                last_login_at: true,
                created_at: true,
                locked_until: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return users;
    }
    /**
     * Obtenir un utilisateur par ID
     */
    async getUserById(companyId, userId) {
        const user = await database_1.default.users.findFirst({
            where: {
                id: userId,
                company_id: companyId,
                deleted_at: null,
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                avatar_url: true,
                role: true,
                permissions: true,
                preferences: true,
                language: true,
                timezone: true,
                email_verified: true,
                two_factor_enabled: true,
                last_login_at: true,
                last_login_ip: true,
                created_at: true,
                updated_at: true,
                locked_until: true,
            },
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        return user;
    }
    /**
     * Mettre à jour l'URL de l'avatar de l'utilisateur connecté
     */
    async updateAvatarUrl(userId, avatarUrl) {
        await database_1.default.users.update({
            where: { id: userId },
            data: { avatar_url: avatarUrl, updated_at: new Date() },
        });
        return avatarUrl;
    }
    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(companyId, userId, updaterId, data) {
        // Vérifier que l'utilisateur existe et appartient à l'entreprise
        const user = await database_1.default.users.findFirst({
            where: {
                id: userId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        // Vérifier que le modificateur est admin
        const updater = await database_1.default.users.findUnique({
            where: { id: updaterId },
        });
        if (!updater || updater.role !== 'admin') {
            throw new Error('Seuls les administrateurs peuvent modifier les utilisateurs');
        }
        // Empêcher de modifier son propre rôle
        if (userId === updaterId && data.role && data.role !== user.role) {
            throw new Error('Vous ne pouvez pas modifier votre propre rôle');
        }
        const validated = updateUserSchema.parse(data);
        const updated = await database_1.default.users.update({
            where: { id: userId },
            data: {
                ...(validated.firstName !== undefined && { first_name: validated.firstName }),
                ...(validated.lastName !== undefined && { last_name: validated.lastName }),
                ...(validated.phone !== undefined && { phone: validated.phone }),
                ...(validated.role !== undefined && { role: validated.role }),
                ...(validated.permissions !== undefined && { permissions: validated.permissions }),
                ...(validated.lockedUntil !== undefined && { locked_until: validated.lockedUntil }),
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                role: true,
                permissions: true,
                updated_at: true,
                locked_until: true,
            },
        });
        logger_1.default.info('User updated', { userId, updaterId, companyId });
        return updated;
    }
    /**
     * Supprimer un utilisateur (soft delete)
     * DÉPRÉCIÉ : Utiliser accountDeletionService.deleteAccount() à la place
     * Conservé pour compatibilité ascendante
     */
    async deleteUser(companyId, userId, deleterId) {
        // Déléguer au service de suppression de compte pour une gestion complète
        const accountDeletionService = (await Promise.resolve().then(() => __importStar(require('./account-deletion.service')))).default;
        // Vérifier que l'utilisateur appartient à l'entreprise
        const user = await database_1.default.users.findFirst({
            where: {
                id: userId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        // Utiliser le service de suppression amélioré
        return await accountDeletionService.deleteAccount(userId, deleterId, {
            reason: `Suppression par admin de l'entreprise ${companyId}`,
        });
    }
    /**
     * Réinitialiser le mot de passe d'un utilisateur (admin seulement)
     */
    async resetUserPassword(companyId, userId, adminId, newPassword) {
        // Vérifier que l'utilisateur existe
        const user = await database_1.default.users.findFirst({
            where: {
                id: userId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        // Vérifier que c'est un admin
        const admin = await database_1.default.users.findUnique({
            where: { id: adminId },
        });
        if (!admin || admin.role !== 'admin') {
            throw new Error('Seuls les administrateurs peuvent réinitialiser les mots de passe');
        }
        // Valider le mot de passe
        if (newPassword.length < 8 || !/^(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, parseInt(env_1.default.BCRYPT_ROUNDS));
        await database_1.default.users.update({
            where: { id: userId },
            data: {
                password_hash: passwordHash,
                password_reset_token: null,
                password_reset_expires_at: null,
                locked_until: null, // Déverrouiller le compte
                failed_login_attempts: 0,
            },
        });
        logger_1.default.info('User password reset', { userId, adminId, companyId });
        return { success: true };
    }
}
exports.UserService = UserService;
exports.default = new UserService();
//# sourceMappingURL=user.service.js.map