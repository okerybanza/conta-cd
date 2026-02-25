import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * SPRINT 1 - TASK 1.6 (CODE-006): Idempotency middleware (minimal version)
 *
 * Checks for Idempotency-Key header and prevents duplicate operations
 */
export declare function idempotencyMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=idempotency.middleware.d.ts.map