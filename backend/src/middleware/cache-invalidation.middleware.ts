import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';

/**
 * Middleware pour invalider le cache après une mutation réussie
 * @param patterns Patterns de clés à invalider (peut contenir :companyId comme placeholder)
 */
export const invalidateCache = (...patterns: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Sauvegarder la fonction send originale
    const originalSend = res.send.bind(res);

    // Intercepter la réponse
    res.send = function (body: any) {
      // Si la requête a réussi (status < 400)
      if (res.statusCode < 400) {
        const companyId = (req.user as any)?.companyId;
        
        if (companyId) {
          // Remplacer :companyId par l'ID réel et invalider
          patterns.forEach((pattern) => {
            const cachePattern = pattern.replace(':companyId', companyId);
            cacheService.deletePattern(cachePattern).catch((err) => {
              logger.error(`Error invalidating cache pattern ${cachePattern}:`, err);
            });
          });
          
          logger.debug(`Cache invalidated for company ${companyId}`, { patterns });
        }
      }

      // Appeler la fonction send originale
      return originalSend(body);
    };

    next();
  };
};

/**
 * Middleware pour invalider le cache du dashboard spécifiquement
 */
export const invalidateDashboardCache = invalidateCache('dashboard:stats::companyId:*');

/**
 * Middleware pour invalider le cache des quotas
 */
export const invalidateQuotaCache = invalidateCache(
  'quota:summary::companyId',
  'package:features::companyId',
  'package:limits::companyId'
);

/**
 * Middleware pour invalider tout le cache d'une entreprise
 */
export const invalidateCompanyCache = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send.bind(res);

  res.send = function (body: any) {
    if (res.statusCode < 400) {
      const companyId = (req.user as any)?.companyId;
      
      if (companyId) {
        cacheService.invalidateCompany(companyId).catch((err) => {
          logger.error(`Error invalidating company cache for ${companyId}:`, err);
        });
        
        logger.debug(`All cache invalidated for company ${companyId}`);
      }
    }

    return originalSend(body);
  };

  next();
};

