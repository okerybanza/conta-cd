import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import datarissageService from '../services/datarissage.service';
import { CustomError } from './error.middleware';

/**
 * Middleware pour empêcher la modification des éléments verrouillés après datarissage
 * 
 * Utilisation:
 * router.put('/company', 
 *   authMiddleware.authenticate,
 *   datarissageMiddleware.preventLockedField('currency', 'businessType'),
 *   companyController.update
 * );
 */
export const preventLockedField = (...fields: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.companyId) {
        return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      // Vérifier chaque champ
      for (const field of fields) {
        const isLocked = await datarissageService.isFieldLocked(req.user.companyId, field);
        
        if (isLocked && req.body[field] !== undefined) {
          // Le champ est verrouillé et l'utilisateur essaie de le modifier
          return next(new CustomError(
            `Le champ "${field}" est verrouillé après le datarissage et ne peut pas être modifié. Contactez le support pour une modification.`,
            403,
            'FIELD_LOCKED'
          ));
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier que le datarissage est complété avant d'accéder à certaines routes
 */
export const requireDatarissageCompleted = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.companyId) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const isCompleted = await datarissageService.isCompleted(req.user.companyId);
    
    if (!isCompleted) {
      return next(new CustomError(
        'Le datarissage doit être complété avant d\'accéder à cette fonctionnalité',
        403,
        'DATARISSAGE_NOT_COMPLETED'
      ));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pour vérifier qu'un module est activé
 */
export const requireModuleEnabled = (module: 'facturation' | 'comptabilite' | 'stock' | 'rh') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.companyId) {
        return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      const prisma = (await import('../config/database')).default;
      const company = await prisma.companies.findUnique({
        where: { id: req.user.companyId },
        select: {
          module_facturation_enabled: true,
          module_comptabilite_enabled: true,
          module_stock_enabled: true,
          module_rh_enabled: true,
        },
      });

      if (!company) {
        return next(new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND'));
      }

      const moduleFieldMap = {
        facturation: 'module_facturation_enabled',
        comptabilite: 'module_comptabilite_enabled',
        stock: 'module_stock_enabled',
        rh: 'module_rh_enabled',
      };

      const isEnabled = company[moduleFieldMap[module] as keyof typeof company] as boolean;

      if (!isEnabled) {
        return next(new CustomError(
          `Le module ${module} n'est pas activé. Activez-le dans les paramètres du datarissage.`,
          403,
          'MODULE_NOT_ENABLED'
        ));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

