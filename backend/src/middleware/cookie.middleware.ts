import { Response } from 'express';
import env from '../config/env';

/**
 * Set authentication cookies (HttpOnly for security)
 * This prevents XSS attacks by making tokens inaccessible to JavaScript
 */
export function setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
): void {
    const isProduction = env.NODE_ENV === 'production';

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
export function clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
        path: '/api/v1/auth/refresh',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
}
