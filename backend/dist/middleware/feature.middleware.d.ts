import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { PackageFeature } from '../services/quota.service';
/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * (wrapper mince autour de quotaService.requireFeature)
 */
export declare function requireFeature(feature: PackageFeature): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export default requireFeature;
//# sourceMappingURL=feature.middleware.d.ts.map