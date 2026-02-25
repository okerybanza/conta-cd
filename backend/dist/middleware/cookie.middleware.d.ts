import { Response } from 'express';
/**
 * Set authentication cookies (HttpOnly for security)
 * This prevents XSS attacks by making tokens inaccessible to JavaScript
 */
export declare function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void;
/**
 * Clear authentication cookies on logout
 */
export declare function clearAuthCookies(res: Response): void;
//# sourceMappingURL=cookie.middleware.d.ts.map