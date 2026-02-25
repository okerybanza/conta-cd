"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuthUrl = getGoogleAuthUrl;
exports.getGoogleUserFromCode = getGoogleUserFromCode;
exports.findOrCreateUserFromOAuth = findOrCreateUserFromOAuth;
/**
 * OAuth : connexion avec Google, Apple, Microsoft.
 * Échange le code fournisseur contre les infos utilisateur, puis trouve ou crée l'utilisateur Conta et retourne les tokens.
 */
const axios_1 = __importDefault(require("axios"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
/**
 * Construire l'URL de redirection Google (étape 1)
 */
function getGoogleAuthUrl(redirectUri) {
    if (!env_1.default.GOOGLE_CLIENT_ID) {
        throw new error_middleware_1.CustomError('Connexion Google non configurée', 503, 'OAUTH_NOT_CONFIGURED');
    }
    const params = new URLSearchParams({
        client_id: env_1.default.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
/**
 * Échanger le code Google contre les infos utilisateur (étape 2)
 */
async function getGoogleUserFromCode(code, redirectUri) {
    if (!env_1.default.GOOGLE_CLIENT_ID || !env_1.default.GOOGLE_CLIENT_SECRET) {
        throw new error_middleware_1.CustomError('Connexion Google non configurée', 503, 'OAUTH_NOT_CONFIGURED');
    }
    const tokenRes = await axios_1.default.post(GOOGLE_TOKEN_URL, new URLSearchParams({
        code,
        client_id: env_1.default.GOOGLE_CLIENT_ID,
        client_secret: env_1.default.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
    }).catch((err) => {
        logger_1.default.warn('Google token exchange failed', { message: err.message, response: err.response?.data });
        throw new error_middleware_1.CustomError('Connexion Google échouée', 400, 'OAUTH_TOKEN_EXCHANGE_FAILED');
    });
    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
        throw new error_middleware_1.CustomError('Connexion Google échouée', 400, 'OAUTH_NO_ACCESS_TOKEN');
    }
    const userRes = await axios_1.default.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
    }).catch((err) => {
        logger_1.default.warn('Google userinfo failed', { message: err.message });
        throw new error_middleware_1.CustomError('Impossible de récupérer les informations Google', 400, 'OAUTH_USERINFO_FAILED');
    });
    const data = userRes.data;
    const email = data?.email;
    if (!email) {
        throw new error_middleware_1.CustomError('Email non fourni par Google', 400, 'OAUTH_EMAIL_REQUIRED');
    }
    const name = (data?.name || '').trim();
    const parts = name ? name.split(/\s+/) : [];
    const firstName = data?.given_name || parts[0] || '';
    const lastName = data?.family_name || parts.slice(1).join(' ') || '';
    return {
        email: email.toLowerCase(),
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        picture: data?.picture,
    };
}
/**
 * Trouver ou créer un utilisateur à partir des infos OAuth, puis retourner user + company + tokens.
 * Utilise le même format que login/verifyEmail pour le frontend.
 */
async function findOrCreateUserFromOAuth(oauthUser, authService) {
    const existingUser = await database_1.default.users.findFirst({
        where: { email: oauthUser.email, deleted_at: null },
        include: { companies: true },
    });
    if (existingUser) {
        if (!existingUser.email_verified) {
            await database_1.default.users.update({
                where: { id: existingUser.id },
                data: { email_verified: true, updated_at: new Date() },
            });
        }
        const company = existingUser.companies;
        const tokens = authService.generateTokens(existingUser, company);
        return {
            user: {
                id: existingUser.id,
                email: existingUser.email,
                firstName: existingUser.first_name || '',
                lastName: existingUser.last_name || '',
                role: existingUser.role,
                twoFactorEnabled: existingUser.two_factor_enabled || false,
                isSuperAdmin: existingUser.is_super_admin || false,
                isContaUser: existingUser.is_conta_user || false,
                contaRole: existingUser.conta_role || null,
                isAccountant: existingUser.is_accountant || false,
                companyId: existingUser.company_id || null,
            },
            company: company ? { id: company.id, name: company.name } : null,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    // Créer une entreprise + utilisateur (comme une inscription simplifiée, email déjà vérifié par le fournisseur)
    const companyName = oauthUser.lastName
        ? `${oauthUser.firstName || ''} ${oauthUser.lastName}`.trim() || 'Mon entreprise'
        : oauthUser.firstName || 'Mon entreprise';
    const passwordHash = await bcrypt_1.default.hash((0, crypto_1.randomUUID)() + Date.now(), parseInt(env_1.default.BCRYPT_ROUNDS));
    const now = new Date();
    const company = await database_1.default.companies.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            name: companyName,
            email: oauthUser.email,
            account_type: 'STARTUP',
            created_at: now,
            updated_at: now,
        },
    });
    const user = await database_1.default.users.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            email: oauthUser.email,
            password_hash: passwordHash,
            first_name: oauthUser.firstName || null,
            last_name: oauthUser.lastName || null,
            company_id: company.id,
            role: 'admin',
            email_verified: true,
            created_at: now,
            updated_at: now,
        },
        include: { companies: true },
    });
    const tokens = authService.generateTokens(user, company);
    logger_1.default.info('OAuth user created', { userId: user.id, email: user.email });
    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            role: user.role,
            twoFactorEnabled: false,
            isSuperAdmin: false,
            isContaUser: false,
            contaRole: null,
            isAccountant: false,
            companyId: user.company_id || null,
        },
        company: { id: company.id, name: company.name },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    };
}
//# sourceMappingURL=auth-oauth.service.js.map