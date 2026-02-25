/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks by limiting the number of requests
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const emailVerificationRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const registrationRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rate-limit.middleware.d.ts.map