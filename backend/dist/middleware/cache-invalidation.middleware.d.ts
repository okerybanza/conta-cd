import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour invalider le cache après une mutation réussie
 * @param patterns Patterns de clés à invalider (peut contenir :companyId comme placeholder)
 */
export declare const invalidateCache: (...patterns: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour invalider le cache du dashboard spécifiquement
 */
export declare const invalidateDashboardCache: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour invalider le cache des quotas
 */
export declare const invalidateQuotaCache: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour invalider tout le cache d'une entreprise
 */
export declare const invalidateCompanyCache: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=cache-invalidation.middleware.d.ts.map