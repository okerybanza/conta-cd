import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { CustomError } from './error.middleware';
import contaPermissionsService from '../services/conta-permissions.service';

/**
 * Middleware pour vérifier une permission Conta spécifique
 */
export function requireContaPermission(module: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      // Super Admin a toujours accès
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Vérifier la permission via le service Conta
      const hasPermission = await contaPermissionsService.hasPermission(
        {
          userId: req.user.id,
          contaRole: (req.user as any).contaRole,
          isContaUser: !!req.user.isContaUser,
        },
        module,
        action
      );

      if (!hasPermission) {
        throw new CustomError(
          `Insufficient Conta permissions: ${module}.${action}`,
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Vérifier si un utilisateur a une permission (utilitaire)
 */
export async function checkContaPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  try {
    const hasPermission = await contaPermissionsService.hasPermission(
      {
        userId,
        contaRole: null,
        isContaUser: true,
      },
      module,
      action
    );
    return hasPermission;
  } catch (error) {
    return false;
  }
}

