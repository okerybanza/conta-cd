import { Response, NextFunction } from 'express';
import { QuotaMetric, PackageFeature } from '../services/quota.service';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour vérifier une limite de quota
 * Lance une erreur 403 si la limite est atteinte
 */
export declare function checkQuota(metric: QuotaMetric): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * Lance une erreur 403 si la fonctionnalité n'est pas disponible
 */
export declare function requireFeature(feature: PackageFeature): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=quota.middleware.d.ts.map