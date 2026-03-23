import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from './auth.middleware';
import CustomError from '../utils/CustomError';
import prisma from '../config/database';

/**
 * Vérifier si un utilisateur a accès à un module selon son plan
 */
async function hasModuleAccess(companyId: string, module: string): Promise<boolean> {
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  if (!company?.subscription?.package) {
    return false;
  }

  const packageFeatures = (company.subscription.package.features as any) || {};

  // Mapping des modules aux features du package
  const moduleFeatureMap: Record<string, string> = {
    expenses: 'expenses',
    accounting: 'accounting',
    hr: 'hr', // Plan 360 uniquement
    api: 'api',
  };

  const feature = moduleFeatureMap[module];
  if (feature) {
    return packageFeatures[feature] === true;
  }

  // Les modules de base (invoices, customers, products, payments) sont toujours disponibles
  return true;
}

/**
 * Vérifier les permissions d'un rôle de base
 */
function hasRolePermission(role: string, module: string, action: string): boolean {
  const rolePermissions: Record<string, Record<string, string[]>> = {
    admin: {
      invoices: ['create', 'read', 'update', 'delete', 'cancel', 'export'],
      customers: ['create', 'read', 'update', 'delete', 'export'],
      products: ['create', 'read', 'update', 'delete', 'export'],
      payments: ['create', 'read', 'update', 'delete', 'refund'],
      expenses: ['create', 'read', 'update', 'delete', 'approve', 'export'],
      accounting: ['access', 'create_entries', 'update_entries', 'delete_entries', 'validate_entries', 'reconcile', 'view_reports', 'export_reports'],
      hr: ['access', 'employees', 'payroll', 'attendance', 'leaves', 'documents'],
      reports: ['sales', 'financial', 'accounting', 'hr', 'export'],
      settings: ['company', 'users', 'subscription', 'integrations', 'api_keys'],
    },
    accountant: {
      invoices: ['create', 'read', 'update', 'export'],
      customers: ['create', 'read', 'update'],
      products: ['create', 'read', 'update'],
      payments: ['create', 'read', 'update'],
      expenses: ['create', 'read', 'update'],
      accounting: ['access', 'create_entries', 'update_entries', 'validate_entries', 'reconcile', 'view_reports', 'export_reports'],
      reports: ['sales', 'financial', 'accounting', 'export'],
    },
    manager: {
      invoices: ['create', 'read', 'export'],
      customers: ['create', 'read'],
      products: ['create', 'read'],
      payments: ['read'],
      reports: ['sales'],
    },
    employee: {
      invoices: ['read'],
      customers: ['read'],
      products: ['read'],
    },
  };

  const modulePermissions = rolePermissions[role]?.[module] || [];
  return modulePermissions.includes(action);
}

/**
 * Middleware pour vérifier une permission spécifique
 */
export function requirePermission(module: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      // 1. Vérifier l'accès au module selon le plan
      const companyId = getCompanyId(req);
      const hasAccess = await hasModuleAccess(companyId, module);
      if (!hasAccess) {
        return next(
          new CustomError(
            `Module ${module} non disponible dans votre plan d'abonnement`,
            403,
            'MODULE_NOT_AVAILABLE'
          )
        );
      }

      // 2. Récupérer les permissions de l'utilisateur
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!user) {
        return next(new CustomError('User not found', 404, 'USER_NOT_FOUND'));
      }

      // 3. Vérifier les permissions personnalisées
      const customPermissions = (user.permissions as any) || {};
      if (customPermissions[module]?.[action] !== undefined) {
        if (customPermissions[module][action] === true) {
          return next();
        } else {
          return next(
            new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
          );
        }
      }

      // 4. Vérifier le rôle de base
      if (hasRolePermission(user.role || 'manager', module, action)) {
        return next();
      }

      return next(new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Vérifier si un utilisateur a une permission (utilitaire)
 */
export async function checkPermission(
  userId: string,
  companyId: string,
  module: string,
  action: string
): Promise<boolean> {
  try {
    // Vérifier l'accès au module
    const hasAccess = await hasModuleAccess(companyId, module);
    if (!hasAccess) {
      return false;
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!user) {
      return false;
    }

    // Vérifier les permissions personnalisées
    const customPermissions = (user.permissions as any) || {};
    if (customPermissions[module]?.[action] !== undefined) {
      return customPermissions[module][action] === true;
    }

    // Vérifier le rôle de base
    return hasRolePermission(user.role || 'manager', module, action);
  } catch (error) {
    return false;
  }
}

