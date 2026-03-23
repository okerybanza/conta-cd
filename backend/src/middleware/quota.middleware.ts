import { Response, NextFunction } from 'express';
import quotaService, { QuotaMetric, PackageFeature } from '../services/quota.service';
import { CustomError } from './error.middleware';
import { AuthRequest, getCompanyId } from './auth.middleware';

/**
 * Middleware pour vérifier une limite de quota
 * Lance une erreur 403 si la limite est atteinte
 */
export function checkQuota(metric: QuotaMetric) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = getCompanyId(req);
      await quotaService.checkLimit(companyId, metric);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware pour vérifier qu'une fonctionnalité est disponible
 * Lance une erreur 403 si la fonctionnalité n'est pas disponible
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

