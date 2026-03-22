import { Request, Response, NextFunction } from 'express';
/**
 * Generate and set CSRF token cookie
 * The token is readable by JavaScript so the frontend can send it in headers
 */
export declare function generateCsrfToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate CSRF token for state-changing requests
 * Compares cookie value with header value
 */
export declare function validateCsrfToken(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=csrf.middleware.d.ts.map