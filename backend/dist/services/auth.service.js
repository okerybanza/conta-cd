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
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = require("crypto");
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const account_deletion_service_1 = __importDefault(require("./account-deletion.service"));
class AuthService {
    generateEmailVerificationCode() {
        // 6 chiffres, 100000–999999
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    // Inscription
    async register(data) {
        // 1. Vérifier si l'email peut être réutilisé (respect de la période de grâce)
        const emailCheck = await account_deletion_service_1.default.canReuseEmail(data.email);
        if (!emailCheck.canReuse) {
            if (emailCheck.gracePeriodEnd) {
                // Période de grâce encore active
                throw new error_middleware_1.CustomError(emailCheck.reason || 'Email non disponible', 409, 'EMAIL_IN_GRACE_PERIOD', {
                    gracePeriodEnd: emailCheck.gracePeriodEnd,
                    canRestore: true,
                });
            }
            else {
                // Email déjà utilisé par un compte actif
                throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
            }
        }
        // 2. Vérifier email existe déjà (uniquement pour les utilisateurs non supprimés)
        // (Double vérification pour sécurité, même si canReuseEmail devrait déjà l'avoir fait)
        const existingUser = await database_1.default.users.findFirst({
            where: {
                email: data.email,
                deleted_at: null,
            },
        });
        if (existingUser) {
            throw new error_middleware_1.CustomError('Email already exists', 409, 'EMAIL_EXISTS');
        }
        // 3. Hasher mot de passe
        const passwordHash = await bcrypt_1.default.hash(data.password, parseInt(env_1.default.BCRYPT_ROUNDS));
        // 4. Générer un code de vérification email (OTP)
        const verificationCode = this.generateEmailVerificationCode();
        const verificationCodeHash = await bcrypt_1.default.hash(verificationCode, parseInt(env_1.default.BCRYPT_ROUNDS));
        const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // 5. Créer entreprise et utilisateur (aucun abonnement ; l'utilisateur choisira un plan après vérification email)
        const result = await database_1.default.$transaction(async (tx) => {
            // Déterminer le type de compte (profil)
            const accountTypeMap = {
                entrepreneur: 'ENTREPRENEUR',
                startup: 'STARTUP',
                ong_firm: 'ONG_FIRM',
                expert_comptable: 'EXPERT_COMPTABLE',
            };
            const rawAccountType = data.accountType || 'startup';
            const prismaAccountType = accountTypeMap[rawAccountType] || accountTypeMap.startup;
            // Créer entreprise
            const now = new Date();
            const company = await tx.companies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    name: data.companyName,
                    email: data.email,
                    account_type: prismaAccountType,
                    created_at: now,
                    updated_at: now,
                },
            });
            // Créer utilisateur (admin par défaut)
            const isExpertComptable = rawAccountType === 'expert_comptable';
            const user = await tx.users.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    email: data.email,
                    password_hash: passwordHash,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    company_id: company.id,
                    role: 'admin',
                    is_accountant: isExpertComptable,
                    email_verified: false,
                    email_verification_token: verificationCodeHash,
                    email_verification_expires_at: verificationExpiresAt,
                    created_at: now,
                    updated_at: now,
                },
            });
            return { company, user };
        });
        logger_1.default.info('User registered', { userId: result.user.id, email: data.email });
        // 6. Envoyer email de vérification (code)
        try {
            const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
            const frontendUrl = env_1.default.FRONTEND_URL || 'http://localhost:5173';
            const accountType = result.company.account_type || 'STARTUP';
            await emailService.sendEmail({
                from: env_1.default.SMTP_NOTIF_FROM || env_1.default.SMTP_FROM || env_1.default.SMTP_USER || '',
                to: result.user.email,
                subject: 'Conta - Confirmez votre adresse email',
                template: 'email-verification-code',
                data: {
                    firstName: result.user.first_name || 'Utilisateur',
                    companyName: result.company.name,
                    verificationCode,
                    verificationMinutes: 15,
                    verifyUrl: `${frontendUrl}/verify-email?email=${encodeURIComponent(result.user.email)}&accountType=${encodeURIComponent(accountType)}`,
                    supportEmail: env_1.default.SUPPORT_EMAIL || 'support@conta.cd',
                },
            });
            logger_1.default.info('Verification email sent', { userId: result.user.id, email: data.email });
        }
        catch (error) {
            logger_1.default.error('Error sending verification email', {
                userId: result.user.id,
                email: data.email,
                error: error.message,
            });
            // Ne pas faire échouer l'inscription si l'email échoue
        }
        // IMPORTANT: on ne renvoie pas de tokens tant que l'email n'est pas vérifié
        return {
            requiresEmailVerification: true,
            email: result.user.email,
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.first_name || '',
                lastName: result.user.last_name || '',
                role: result.user.role,
                emailVerified: false,
            },
            company: {
                id: result.company.id,
                name: result.company.name,
            },
            // Aide DEV uniquement pour tests automatisés (pas en production)
            ...(env_1.default.NODE_ENV !== 'production' ? { devVerificationCode: verificationCode } : {}),
        };
    }
    async resendEmailVerification(email) {
        const user = await database_1.default.users.findFirst({
            where: {
                email,
                deleted_at: null,
            },
            include: { companies: true },
        });
        if (!user) {
            throw new error_middleware_1.CustomError('Email not found', 404, 'EMAIL_NOT_FOUND');
        }
        if (user.email_verified) {
            return { success: true, alreadyVerified: true };
        }
        const verificationCode = this.generateEmailVerificationCode();
        const verificationCodeHash = await bcrypt_1.default.hash(verificationCode, parseInt(env_1.default.BCRYPT_ROUNDS));
        const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await database_1.default.users.update({
            where: { id: user.id },
            data: {
                email_verification_token: verificationCodeHash,
                email_verification_expires_at: verificationExpiresAt,
                updated_at: new Date(),
            },
        });
        // Envoyer email de vérification
        const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
        const frontendUrl = env_1.default.FRONTEND_URL || 'http://localhost:5173';
        await emailService.sendEmail({
            from: env_1.default.SMTP_NOTIF_FROM || env_1.default.SMTP_FROM || env_1.default.SMTP_USER || '',
            to: user.email,
            subject: 'Conta - Votre code de confirmation email',
            template: 'email-verification-code',
            data: {
                firstName: user.first_name || 'Utilisateur',
                companyName: user.companies?.name || 'Conta',
                verificationCode,
                verificationMinutes: 15,
                verifyUrl: `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}`,
                supportEmail: env_1.default.SUPPORT_EMAIL || 'support@conta.cd',
            },
        });
        return {
            success: true,
            ...(env_1.default.NODE_ENV !== 'production' ? { devVerificationCode: verificationCode } : {}),
        };
    }
    /**
     * Dev-only helper: inspect email status for QA / support
     */
    async getEmailStatus(email) {
        // Chercher d'abord un utilisateur actif
        const activeUser = await database_1.default.users.findFirst({
            where: {
                email,
                deleted_at: null,
            },
        });
        if (activeUser) {
            return {
                exists: true,
                emailVerified: !!activeUser.email_verified,
                deleted: false,
                userId: activeUser.id,
                companyId: activeUser.company_id,
                createdAt: activeUser.created_at,
                lastLoginAt: activeUser.last_login_at,
            };
        }
        // Sinon, chercher un utilisateur supprimé (soft delete)
        const deletedUser = await database_1.default.users.findFirst({
            where: {
                email,
                deleted_at: {
                    not: null,
                },
            },
        });
        if (deletedUser) {
            return {
                exists: true,
                emailVerified: !!deletedUser.email_verified,
                deleted: true,
                userId: deletedUser.id,
                companyId: deletedUser.company_id,
                createdAt: deletedUser.created_at,
                lastLoginAt: deletedUser.last_login_at,
            };
        }
        // Aucun utilisateur trouvé avec cet email (actif ou supprimé)
        return {
            exists: false,
            emailVerified: null,
            deleted: null,
            userId: null,
            companyId: null,
            createdAt: null,
            lastLoginAt: null,
        };
    }
    async verifyEmail(email, code, ipAddress) {
        const user = await database_1.default.users.findFirst({
            where: {
                email,
                deleted_at: null,
            },
            include: { companies: true },
        });
        if (!user) {
            throw new error_middleware_1.CustomError('Email not found', 404, 'EMAIL_NOT_FOUND');
        }
        if (user.email_verified) {
            // Déjà vérifié → renvoyer des tokens pour permettre de continuer
            const tokens = this.generateTokens(user, user.companies);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    role: user.role,
                    twoFactorEnabled: user.two_factor_enabled || false,
                    isSuperAdmin: user.is_super_admin || false,
                    isContaUser: user.is_conta_user || false,
                    contaRole: user.conta_role || null,
                    isAccountant: user.is_accountant || false,
                    companyId: user.company_id || null,
                },
                company: user.companies ? { id: user.companies.id, name: user.companies.name } : null,
                ...tokens,
            };
        }
        if (!user.email_verification_token || !user.email_verification_expires_at) {
            throw new error_middleware_1.CustomError('Email verification required', 400, 'EMAIL_VERIFICATION_REQUIRED');
        }
        if (user.email_verification_expires_at < new Date()) {
            throw new error_middleware_1.CustomError('Verification code expired', 400, 'EMAIL_VERIFICATION_CODE_EXPIRED');
        }
        const ok = await bcrypt_1.default.compare(code, user.email_verification_token);
        if (!ok) {
            throw new error_middleware_1.CustomError('Invalid verification code', 400, 'EMAIL_VERIFICATION_CODE_INVALID');
        }
        await database_1.default.users.update({
            where: { id: user.id },
            data: {
                email_verified: true,
                email_verification_token: null,
                email_verification_expires_at: null,
                last_login_at: new Date(),
                last_login_ip: ipAddress,
                updated_at: new Date(),
            },
        });
        const tokens = this.generateTokens({ ...user, email_verified: true }, user.companies);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                role: user.role,
                twoFactorEnabled: user.two_factor_enabled || false,
                isSuperAdmin: user.is_super_admin || false,
                isContaUser: user.is_conta_user || false,
                contaRole: user.conta_role || null,
                isAccountant: user.is_accountant || false,
                companyId: user.company_id || null,
            },
            company: user.companies ? { id: user.companies.id, name: user.companies.name } : null,
            ...tokens,
        };
    }
    // Connexion
    async login(data, ipAddress) {
        // Trouver utilisateur actif
        const user = await database_1.default.users.findFirst({
            where: {
                email: data.email,
                deleted_at: null,
            },
            include: {
                companies: true,
            },
        });
        if (!user) {
            // Distinguer "email non trouvé" de "mot de passe incorrect" pour meilleure UX
            throw new error_middleware_1.CustomError('Email not found. Please create an account', 401, 'EMAIL_NOT_FOUND');
        }
        // Bloquer la connexion tant que l'email n'est pas vérifié
        if (!user.email_verified) {
            throw new error_middleware_1.CustomError('Email not verified', 403, 'EMAIL_NOT_VERIFIED', {
                email: user.email,
            });
        }
        // Vérifier compte non verrouillé
        if (user.locked_until && user.locked_until > new Date()) {
            const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
            throw new error_middleware_1.CustomError(`Account locked. Try again in ${minutesLeft} minutes`, 403, 'ACCOUNT_LOCKED');
        }
        // Vérifier mot de passe
        const passwordValid = await bcrypt_1.default.compare(data.password, user.password_hash);
        if (!passwordValid) {
            // Incrémenter tentatives échouées
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
            await database_1.default.users.update({
                where: { id: user.id },
                data: {
                    failed_login_attempts: failedAttempts,
                    locked_until: lockedUntil,
                },
            });
            throw new error_middleware_1.CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        // Vérifier 2FA si activé
        if (user.two_factor_enabled) {
            if (!data.twoFactorCode) {
                throw new error_middleware_1.CustomError('2FA code required', 401, '2FA_REQUIRED');
            }
            // Try TOTP first
            let verified = speakeasy_1.default.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: data.twoFactorCode,
                window: 2, // Tolérance ±2 périodes
            });
            // If TOTP fails, try backup codes
            if (!verified && user.two_factor_backup_codes && user.two_factor_backup_codes.length > 0) {
                for (let i = 0; i < user.two_factor_backup_codes.length; i++) {
                    const isMatch = await bcrypt_1.default.compare(data.twoFactorCode, user.two_factor_backup_codes[i]);
                    if (isMatch) {
                        verified = true;
                        // Remove used backup code
                        const updatedCodes = [...user.two_factor_backup_codes];
                        updatedCodes.splice(i, 1);
                        await database_1.default.users.update({
                            where: { id: user.id },
                            data: { two_factor_backup_codes: updatedCodes },
                        });
                        logger_1.default.info('User logged in with backup code', { userId: user.id, remainingCodes: updatedCodes.length });
                        break;
                    }
                }
            }
            if (!verified) {
                throw new error_middleware_1.CustomError('Invalid 2FA code', 401, 'INVALID_2FA_CODE');
            }
        }
        // Réinitialiser tentatives échouées
        await database_1.default.users.update({
            where: { id: user.id },
            data: {
                failed_login_attempts: 0,
                locked_until: null,
                last_login_at: new Date(),
                last_login_ip: ipAddress,
            },
        });
        // Générer tokens
        const tokens = this.generateTokens(user, user.companies);
        logger_1.default.info('User logged in', { userId: user.id, email: data.email });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                role: user.role,
                twoFactorEnabled: user.two_factor_enabled || false,
                isSuperAdmin: user.is_super_admin || false,
                isContaUser: user.is_conta_user || false,
                contaRole: user.conta_role || null,
                isAccountant: user.is_accountant || false,
                companyId: user.company_id || null,
            },
            company: user.companies
                ? {
                    id: user.companies.id,
                    name: user.companies.name,
                }
                : null,
            ...tokens,
        };
    }
    // Générer tokens JWT
    generateTokens(user, company) {
        const jti = (0, crypto_1.randomUUID)(); // Unique JWT ID for revocation
        const payload = {
            userId: user.id,
            email: user.email,
            companyId: company?.id || user.company_id || null,
            role: user.role,
            jti, // ACCT-006: Session tracking
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.default.JWT_SECRET, { expiresIn: env_1.default.JWT_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.default.JWT_REFRESH_SECRET, {
            expiresIn: env_1.default.JWT_REFRESH_EXPIRES_IN,
        });
        return { accessToken, refreshToken, jti };
    }
    // Rafraîchir access token
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.default.JWT_REFRESH_SECRET);
            // SPRINT 5 - TASK 5.3: Check revocation for Refresh Token
            if (decoded.jti) {
                const { default: revocationService } = await Promise.resolve().then(() => __importStar(require('./auth/revocation.service')));
                const isRevoked = await revocationService.isRevoked(decoded.jti);
                if (isRevoked) {
                    throw new error_middleware_1.CustomError('Refresh token has been revoked', 401, 'REFRESH_TOKEN_REVOKED');
                }
            }
            const user = await database_1.default.users.findFirst({
                where: {
                    id: decoded.userId,
                    deleted_at: null,
                },
                include: { companies: true },
            });
            if (!user) {
                throw new error_middleware_1.CustomError('User not found', 401, 'USER_NOT_FOUND');
            }
            const tokens = this.generateTokens(user, user.companies);
            return tokens;
        }
        catch (error) {
            console.error('REFRESH_ERROR:', error.message, error.stack);
            if (error instanceof error_middleware_1.CustomError)
                throw error;
            throw new error_middleware_1.CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }
    }
    // Activer 2FA
    async enable2FA(userId) {
        const user = await database_1.default.users.findUnique({ where: { id: userId } });
        if (!user) {
            throw new error_middleware_1.CustomError('User not found', 404, 'USER_NOT_FOUND');
        }
        // Générer secret
        const secret = speakeasy_1.default.generateSecret({
            name: `Conta (${user.email})`,
            issuer: 'Conta',
        });
        // Générer QR code
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        // Générer codes backup (plain text to show user ONCE)
        const backupCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
        // Hash backup codes before storing (security best practice)
        const hashedBackupCodes = await Promise.all(backupCodes.map(code => bcrypt_1.default.hash(code, parseInt(env_1.default.BCRYPT_ROUNDS))));
        // Sauvegarder (sans activer encore) - store HASHED codes
        await database_1.default.users.update({
            where: { id: userId },
            data: {
                two_factor_secret: secret.base32,
                two_factor_backup_codes: hashedBackupCodes,
            },
        });
        return {
            secret: secret.base32,
            qrCodeUrl,
            backupCodes,
        };
    }
    // Vérifier et activer 2FA
    async verifyAndEnable2FA(userId, token) {
        const user = await database_1.default.users.findUnique({ where: { id: userId } });
        if (!user || !user.two_factor_secret) {
            throw new error_middleware_1.CustomError('2FA not initialized', 400, '2FA_NOT_INITIALIZED');
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!verified) {
            throw new error_middleware_1.CustomError('Invalid 2FA code', 400, 'INVALID_2FA_CODE');
        }
        await database_1.default.users.update({
            where: { id: userId },
            data: {
                two_factor_enabled: true,
            },
        });
        return { success: true };
    }
    // Désactiver 2FA
    async disable2FA(userId, password) {
        const user = await database_1.default.users.findUnique({ where: { id: userId } });
        if (!user) {
            throw new error_middleware_1.CustomError('User not found', 404, 'USER_NOT_FOUND');
        }
        // Vérifier mot de passe
        const passwordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordValid) {
            throw new error_middleware_1.CustomError('Invalid password', 401, 'INVALID_PASSWORD');
        }
        await database_1.default.users.update({
            where: { id: userId },
            data: {
                two_factor_enabled: false,
                two_factor_secret: null,
                two_factor_backup_codes: [],
            },
        });
        return { success: true };
    }
    // Récupération mot de passe - Demander réinitialisation
    async forgotPassword(email) {
        const user = await database_1.default.users.findFirst({
            where: {
                email,
                deleted_at: null,
            },
            include: { companies: true },
        });
        // Ne pas révéler si l'email existe ou non (sécurité)
        if (!user) {
            // Retourner succès même si utilisateur n'existe pas (sécurité)
            return { success: true, message: 'If the email exists, a reset link has been sent' };
        }
        // Générer token de réinitialisation
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // Valide 1 heure
        // Sauvegarder token
        await database_1.default.users.update({
            where: { id: user.id },
            data: {
                password_reset_token: resetToken,
                password_reset_expires_at: resetExpires,
            },
        });
        // Envoyer email de réinitialisation
        try {
            const emailService = (await Promise.resolve().then(() => __importStar(require('./email.service')))).default;
            const frontendUrl = env_1.default.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
            // Logger pour debug
            logger_1.default.info('Generating password reset URL', {
                frontendUrl,
                resetUrl: resetUrl.substring(0, 50) + '...',
                tokenLength: resetToken.length,
            });
            const emailSent = await emailService.sendEmail({
                from: env_1.default.SMTP_NOTIF_FROM || env_1.default.SMTP_FROM || env_1.default.SMTP_USER || '',
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe - Conta',
                template: 'password-reset',
                data: {
                    firstName: user.first_name || 'Utilisateur',
                    resetUrl, // URL complète avec token
                    companyName: user.companies?.name || 'Conta',
                    supportEmail: env_1.default.SUPPORT_EMAIL || 'support@conta.cd',
                },
            });
            if (emailSent) {
                logger_1.default.info('Password reset email sent successfully', {
                    userId: user.id,
                    email: user.email,
                    resetUrl: resetUrl.substring(0, 50) + '...',
                });
            }
            else {
                logger_1.default.warn('Password reset email failed to send (SMTP not configured or error)', {
                    userId: user.id,
                    email: user.email,
                    resetUrl: resetUrl.substring(0, 50) + '...',
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error sending password reset email', {
                userId: user.id,
                email: user.email,
                error: error.message,
                stack: error.stack,
            });
            // Ne pas faire échouer la requête si l'email échoue, mais logger l'erreur
        }
        return { success: true, message: 'If the email exists, a reset link has been sent' };
    }
    // Récupération mot de passe - Réinitialiser
    async resetPassword(token, newPassword) {
        // Trouver utilisateur avec token valide
        const user = await database_1.default.users.findFirst({
            where: {
                password_reset_token: token,
                password_reset_expires_at: {
                    gt: new Date(), // Token non expiré
                },
            },
        });
        if (!user) {
            throw new error_middleware_1.CustomError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
        }
        // Valider nouveau mot de passe
        if (newPassword.length < 8) {
            throw new error_middleware_1.CustomError('Password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
        }
        // Hasher nouveau mot de passe
        const passwordHash = await bcrypt_1.default.hash(newPassword, parseInt(env_1.default.BCRYPT_ROUNDS));
        // Mettre à jour mot de passe et invalider token
        await database_1.default.users.update({
            where: { id: user.id },
            data: {
                password_hash: passwordHash,
                password_reset_token: null,
                password_reset_expires_at: null,
                failed_login_attempts: 0,
                locked_until: null,
            },
        });
        logger_1.default.info('Password reset successful', { userId: user.id });
        return { success: true, message: 'Password reset successfully' };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map