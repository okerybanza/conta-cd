import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CustomError } from './error.middleware';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';

/**
 * Generate and set CSRF token cookie
 * The token is readable by JavaScript so the frontend can send it in headers
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
    // Only generate if cookie doesn't exist
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
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
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];

    // Both must exist and match
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        throw new CustomError(
            'Invalid CSRF token',
            403,
            'CSRF_TOKEN_INVALID'
        );
    }

    next();
}
