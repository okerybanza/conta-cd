import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour vérifier une permission Conta spécifique
 */
export declare function requireContaPermission(module: string, action: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Vérifier si un utilisateur a une permission (utilitaire)
 */
export declare function checkContaPermission(userId: string, module: string, action: string): Promise<boolean>;
//# sourceMappingURL=conta-permissions.middleware.d.ts.map