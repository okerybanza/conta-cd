import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import CustomError from '../utils/CustomError';
import prisma from '../config/database';

/**
 * Middleware pour vérifier que l'utilisateur est Super Admin
 */
export function requireSuperAdmin() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      // Vérifier que l'utilisateur est Super Admin
      const user = await prisma.users.findFirst({
        where: { 
          id: req.user.id,
          deleted_at: null,
        },
        select: {
          is_super_admin: true,
        },
      });

      if (!user || !user.is_super_admin) {
        throw new CustomError(
          'Super Admin access required',
          403,
          'SUPER_ADMIN_REQUIRED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est un utilisateur Conta (interne)
 */
export function requireContaUser(allowedRoles?: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      // Vérifier que l'utilisateur est un utilisateur Conta
      const user = await prisma.users.findFirst({
        where: { 
          id: req.user.id,
          deleted_at: null,
        },
        select: {
          is_conta_user: true,
          is_super_admin: true,
          conta_role: true,
        },
      });

      // Super Admin a toujours accès
      if (user?.is_super_admin) {
        return next();
      }

      if (!user || !user.is_conta_user) {
        throw new CustomError(
          'Conta user access required',
          403,
          'CONTA_USER_REQUIRED'
        );
      }

      // Vérifier le rôle si spécifié
      if (allowedRoles && allowedRoles.length > 0) {
        if (!user.conta_role || !allowedRoles.includes(user.conta_role)) {
          throw new CustomError(
            'Insufficient permissions for this role',
            403,
            'INSUFFICIENT_ROLE_PERMISSIONS'
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Vérifier si un utilisateur est Super Admin (utilitaire)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findFirst({
    where: { 
      id: userId,
      deleted_at: null,
    },
    select: {
      is_super_admin: true,
    },
  });

  return user?.is_super_admin || false;
}

/**
 * Vérifier si un utilisateur est un utilisateur Conta (utilitaire)
 */
export async function isContaUser(userId: string): Promise<boolean> {
  const user = await prisma.users.findFirst({
    where: { 
      id: userId,
      deleted_at: null,
    },
    select: {
      is_conta_user: true,
      is_super_admin: true,
    },
  });

  return user?.is_conta_user || false || user?.is_super_admin || false;
}

