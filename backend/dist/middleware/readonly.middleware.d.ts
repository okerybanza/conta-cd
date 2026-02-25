import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware pour bloquer les actions d'écriture si l'abonnement est expiré.
 * Permet la lecture mais bloque création/édition/suppression.
 *
 * À appliquer sur les routes POST/PUT/PATCH/DELETE des modules métier.
 * Les routes GET restent accessibles même si l'abonnement est expiré.
 */
export declare function requireActiveSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Helper pour vérifier si une entreprise est en mode lecture seule.
 * Utile dans les services pour des vérifications conditionnelles.
 */
export declare function isReadOnlyMode(companyId: string): Promise<boolean>;
//# sourceMappingURL=readonly.middleware.d.ts.map