import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import prisma from '../config/database';
import { CustomError } from './error.middleware';

export interface AuthRequest extends Request {
  // Dans toutes les routes qui utilisent AuthRequest, le middleware authenticate
  // est appliqué en amont, donc user est garanti présent.
  user: {
    id: string;
    email: string;
    companyId: string | null;
    role: string;
    isSuperAdmin?: boolean;
    isContaUser?: boolean;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.accessToken as string | undefined;

    let token: string | null = null;

    // Priorité au cookie HttpOnly (navigateur)
    if (cookieToken) {
      token = cookieToken;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Fallback pour compatibilité API (clients non navigateur)
      token = authHeader.substring(7);
    }

    if (!token) {
      throw new CustomError('No token provided', 401, 'NO_TOKEN');
    }

    // Vérifier token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      companyId: string;
      role: string;
      jti?: string;
    };

    // SPRINT 5 - TASK 5.3 (SCALE-002): Session Scalability / Revocation
    if (decoded.jti) {
      const { default: revocationService } = await import('../services/auth/revocation.service');
      const isRevoked = await revocationService.isRevoked(decoded.jti);
      if (isRevoked) {
        throw new CustomError('Session has been revoked or expired', 401, 'SESSION_REVOKED');
      }
    }

    // Vérifier utilisateur existe et actif
    const user = await prisma.users.findFirst({
      where: {
        id: decoded.userId,
        email: decoded.email,
        deleted_at: null, // snake_case dans where
      },
      select: {
        id: true,
        email: true,
        company_id: true, // snake_case dans select
        role: true,
        locked_until: true, // snake_case dans select
        is_super_admin: true, // snake_case dans select
        is_conta_user: true, // snake_case dans select
      },
    });

    if (!user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Vérifier compte non verrouillé
    if (user.locked_until && user.locked_until > new Date()) {
      throw new CustomError('Account is locked', 403, 'ACCOUNT_LOCKED');
    }

    // Ajouter user à la requête
    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.company_id ?? null, // snake_case dans le résultat
      role: user.role || 'manager',
      isSuperAdmin: user.is_super_admin || false, // snake_case dans le résultat
      isContaUser: user.is_conta_user || false, // snake_case dans le résultat
    };

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error);
    }
    next(new CustomError('Invalid token', 401, 'INVALID_TOKEN'));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
      );
    }

    next();
  };
}

export function requireCompany(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  // Middleware pour s'assurer que l'utilisateur accède uniquement aux données de son entreprise
  // Sera utilisé dans les controllers pour filtrer les requêtes
  next();
}

/**
 * Fonction utilitaire pour obtenir le companyId de manière sûre
 * Lance une erreur si companyId est null (utilisateurs sans entreprise)
 */
export function getCompanyId(req: AuthRequest): string {
  if (!req.user) {
    throw new CustomError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  if (!req.user.companyId) {
    throw new CustomError('Company ID required', 400, 'COMPANY_ID_REQUIRED');
  }

  return req.user.companyId;
}

