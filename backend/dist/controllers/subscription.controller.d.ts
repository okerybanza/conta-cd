import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class SubscriptionController {
    /**
     * GET /api/v1/subscription
     * Obtenir l'abonnement de l'entreprise (quel que soit son statut).
     */
    getActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/subscription
     * Créer (ou réactiver) un abonnement.
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/subscription/upgrade
     * Changer de package (upgrade / downgrade).
     */
    upgrade(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/subscription/cancel
     * Annuler un abonnement.
     */
    cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/subscription/renew
     * Renouveler un abonnement expiré ou annulé.
     */
    renew(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/subscription/quota-summary
     * Résumé des quotas et fonctionnalités.
     */
    getQuotaSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: SubscriptionController;
export default _default;
//# sourceMappingURL=subscription.controller.d.ts.map