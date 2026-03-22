import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour vérifier que l'utilisateur est Super Admin
 */
export declare function requireSuperAdmin(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour vérifier que l'utilisateur est un utilisateur Conta (interne)
 */
export declare function requireContaUser(allowedRoles?: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Vérifier si un utilisateur est Super Admin (utilitaire)
 */
export declare function isSuperAdmin(userId: string): Promise<boolean>;
/**
 * Vérifier si un utilisateur est un utilisateur Conta (utilitaire)
 */
export declare function isContaUser(userId: string): Promise<boolean>;
//# sourceMappingURL=superadmin.middleware.d.ts.map