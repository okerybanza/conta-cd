"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const env_1 = __importDefault(require("../config/env"));
/**
 * Set authentication cookies (HttpOnly for security)
 * This prevents XSS attacks by making tokens inaccessible to JavaScript
 */
function setAuthCookies(res, accessToken, refreshToken) {
    const isProduction = env_1.default.NODE_ENV === 'production';
    // Access token cookie (short-lived)
    res.cookie('accessToken', accessToken, {
        httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
        secure: isProduction, // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT_EXPIRES_IN)
        path: '/', // Available for all routes
    });
    // Refresh token cookie (longer-lived, more restricted)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
    });
}
/**
 * Clear authentication cookies on logout
 */
function clearAuthCookies(res) {
    res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        secure: env_1.default.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
        path: '/api/v1/auth/refresh',
        httpOnly: true,
        secure: env_1.default.NODE_ENV === 'production',
        sameSite: 'strict',
    });
}
//# sourceMappingURL=cookie.middleware.js.map