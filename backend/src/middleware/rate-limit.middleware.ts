import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks by limiting the number of requests
 */

// Strict rate limit for login attempts
export const authRateLimiter = rateLimit({
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
export const passwordResetRateLimiter = rateLimit({
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
export const emailVerificationRateLimiter = rateLimit({
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
export const registrationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
