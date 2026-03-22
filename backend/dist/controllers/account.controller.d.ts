import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AccountController {
    /**
     * POST /api/v1/accounts
     * Créer un compte comptable
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts
     * Lister les comptes
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts/tree
     * Obtenir l'arborescence des comptes
     */
    getTree(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts/:id
     * Obtenir un compte par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts/code/:code
     * Obtenir un compte par code
     */
    getByCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/accounts/:id
     * Mettre à jour un compte
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/accounts/:id
     * Supprimer un compte
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts/:id/balance
     * Obtenir le solde total (compte + enfants)
     */
    getTotalBalance(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/accounts/by-type/:type
     * Obtenir les comptes par type
     */
    findByType(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AccountController;
export default _default;
//# sourceMappingURL=account.controller.d.ts.map