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
exports.AuthController = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const cookie_middleware_1 = require("../middleware/cookie.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const client_1 = require("@prisma/client");
// Schémas de validation
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    companyName: zod_1.z.string().min(1),
    accountType: zod_1.z.enum(['entrepreneur', 'startup', 'ong_firm', 'expert_comptable']).default('startup'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    twoFactorCode: zod_1.z.string().optional(),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/),
});
const verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().min(4).max(32),
});
const resendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
class AuthController {
    async register(req, res, next) {
        try {
            logger_1.default.info('Register request received', { body: req.body });
            const data = registerSchema.parse(req.body);
            const result = await auth_service_1.default.register(data);
            logger_1.default.info('Registration successful', { userId: result.user.id, email: data.email });
            // Don't set cookies yet - wait for email verification
            // Return data without tokens
            res.status(201).json({
                success: true,
                data: {
                    requiresEmailVerification: result.requiresEmailVerification,
                    email: result.email,
                    user: result.user,
                    company: result.company,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Registration error', {
                error: error?.message,
                stack: error?.stack,
                name: error?.name,
                code: error?.code,
                body: req.body,
            });
            // Erreur Prisma contrainte unique (email déjà utilisé) → 409
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = error.meta?.target?.[0] || 'email';
                next(new error_middleware_1.CustomError(target === 'email' ? 'Un compte existe déjà avec cette adresse email.' : 'Cette valeur est déjà utilisée.', 409, 'EMAIL_EXISTS'));
                return;
            }
            next(error);
        }
    }
    /**
     * Dev / QA: Inspecter l'état d'un email (existe, vérifié, supprimé, etc.).
     * Désactivé automatiquement en production.
     */
    async emailStatus(req, res, next) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Endpoint not available in production',
                    },
                });
            }
            const email = req.query.email?.trim();
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'EMAIL_REQUIRED',
                        message: 'Query parameter "email" is required',
                    },
                });
            }
            const status = await auth_service_1.default.getEmailStatus(email);
            return res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const data = loginSchema.parse(req.body);
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await auth_service_1.default.login(data, ipAddress);
            // Set HttpOnly cookies for security
            (0, cookie_middleware_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
            // Retourner aussi les tokens dans le body pour localStorage (Authorization: Bearer)
            res.json({
                success: true,
                data: {
                    user: result.user,
                    company: result.company,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const data = verifyEmailSchema.parse(req.body);
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await auth_service_1.default.verifyEmail(data.email, data.code, ipAddress);
            // Set HttpOnly cookies after successful email verification
            (0, cookie_middleware_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
            // Retourner aussi les tokens dans le body pour que le frontend les stocke en localStorage
            // (les appels API utilisent Authorization: Bearer depuis localStorage ; sans cela → 401 Invalid token après choix de plan)
            res.json({
                success: true,
                data: {
                    user: result.user,
                    company: result.company,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendEmailVerification(req, res, next) {
        try {
            const data = resendVerificationSchema.parse(req.body);
            const result = await auth_service_1.default.resendEmailVerification(data.email);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            // Try to get refresh token from cookie first, then fallback to body (for API clients)
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token required' },
                });
            }
            const tokens = await auth_service_1.default.refreshToken(refreshToken);
            // Set new cookies
            (0, cookie_middleware_1.setAuthCookies)(res, tokens.accessToken, tokens.refreshToken);
            // Retourner aussi les tokens dans le body pour que le frontend puisse les stocker en localStorage
            // (utile après verify-email quand le client n'a pas encore les tokens en mémoire)
            res.json({
                success: true,
                data: {
                    refreshed: true,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async enable2FA(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const result = await auth_service_1.default.enable2FA(req.user.id);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verify2FA(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'TOKEN_REQUIRED', message: '2FA token required' },
                });
            }
            const result = await auth_service_1.default.verifyAndEnable2FA(req.user.id, token);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async disable2FA(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'PASSWORD_REQUIRED', message: 'Password required' },
                });
            }
            const result = await auth_service_1.default.disable2FA(req.user.id, password);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            // Récupérer infos utilisateur complètes
            const prisma = (await Promise.resolve().then(() => __importStar(require('../config/database')))).default;
            const user = await prisma.users.findFirst({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    role: true,
                    two_factor_enabled: true,
                    companies: {
                        select: {
                            id: true,
                            name: true,
                            logo_url: true,
                        },
                    },
                },
            });
            res.json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = forgotPasswordSchema.parse(req.body);
            const result = await auth_service_1.default.forgotPassword(email);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const data = resetPasswordSchema.parse(req.body);
            const result = await auth_service_1.default.resetPassword(data.token, data.password);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            // SPRINT 5 - TASK 5.3: Centralized Revocation
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const decoded = (await Promise.resolve().then(() => __importStar(require('jsonwebtoken')))).verify(token, (await Promise.resolve().then(() => __importStar(require('../config/env')))).default.JWT_SECRET);
                    if (decoded.jti) {
                        const { default: revocationService } = await Promise.resolve().then(() => __importStar(require('../services/auth/revocation.service')));
                        // Révoquer pour la durée restante du token (ou par défaut 24h)
                        await revocationService.revoke(decoded.jti, 86400);
                    }
                }
                catch (e) {
                    // Ignorer si le token est déjà invalide
                }
            }
            // Clear auth cookies
            (0, cookie_middleware_1.clearAuthCookies)(res);
            res.json({
                success: true,
                message: 'Logged out successfully (Session revoked centrally)',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map