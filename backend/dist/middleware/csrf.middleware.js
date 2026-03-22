"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrfToken = validateCsrfToken;
const crypto_1 = __importDefault(require("crypto"));
const error_middleware_1 = require("./error.middleware");
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';
/**
 * Generate and set CSRF token cookie
 * The token is readable by JavaScript so the frontend can send it in headers
 */
function generateCsrfToken(req, res, next) {
    // Only generate if cookie doesn't exist
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = crypto_1.default.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false, // Must be readable by JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
}
/**
 * Validate CSRF token for state-changing requests
 * Compares cookie value with header value
 */
function validateCsrfToken(req, res, next) {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];
    // Both must exist and match
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        throw new error_middleware_1.CustomError('Invalid CSRF token', 403, 'CSRF_TOKEN_INVALID');
    }
    next();
}
//# sourceMappingURL=csrf.middleware.js.map