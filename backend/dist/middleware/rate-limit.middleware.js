"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRateLimiter = exports.emailVerificationRateLimiter = exports.passwordResetRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks by limiting the number of requests
 */
// Strict rate limit for login attempts
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
        },
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Only count failed requests
    // Use IP address for rate limiting
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
// Moderate rate limit for password reset
exports.passwordResetRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset requests per hour
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de demandes de réinitialisation de mot de passe. Veuillez réessayer plus tard.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
// Lenient rate limit for email verification resend
exports.emailVerificationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 resends per 5 minutes
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de demandes de renvoi de code. Veuillez attendre quelques minutes.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
// General rate limit for registration
// NOTE: les inscriptions réussies ne sont pas comptabilisées, pour ne pas bloquer
// des tests ou un pic légitime de nouveaux comptes derrière la même IP.
// Fenêtre volontairement courte pour faciliter les tests (5 minutes).
exports.registrationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // jusqu'à 30 tentatives d'inscription par 5 minutes et par IP
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // ne compter que les échecs
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
//# sourceMappingURL=rate-limit.middleware.js.map