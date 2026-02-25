import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
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
export declare const preventLockedField: (...fields: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour vérifier que le datarissage est complété avant d'accéder à certaines routes
 */
export declare const requireDatarissageCompleted: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware pour vérifier qu'un module est activé
 */
export declare const requireModuleEnabled: (module: "facturation" | "comptabilite" | "stock" | "rh") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=datarissage.middleware.d.ts.map