import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour vérifier une permission spécifique
 */
export declare function requirePermission(module: string, action: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Vérifier si un utilisateur a une permission (utilitaire)
 */
export declare function checkPermission(userId: string, companyId: string, module: string, action: string): Promise<boolean>;
//# sourceMappingURL=permission.middleware.d.ts.map