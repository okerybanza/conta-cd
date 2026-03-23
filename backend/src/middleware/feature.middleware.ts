import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from './auth.middleware';
import quotaService, { PackageFeature } from '../services/quota.service';

/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * (wrapper mince autour de quotaService.requireFeature)
 */
export function requireFeature(feature: PackageFeature) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyId(req);
      await quotaService.requireFeature(companyId, feature);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default requireFeature;


