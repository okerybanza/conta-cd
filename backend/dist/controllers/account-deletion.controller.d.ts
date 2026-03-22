import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AccountDeletionController {
    /**
     * DELETE /api/v1/account/delete
     * Supprimer son propre compte ou un compte utilisateur (admin)
     */
    deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/account/restore
     * Restaurer un compte supprimé (pendant la période de grâce)
     */
    restoreAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/account/deleted-info
     * Obtenir les informations sur un compte supprimé
     */
    getDeletedAccountInfo(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/account/check-email
     * Vérifier si un email peut être réutilisé (pour l'inscription)
     */
    checkEmailReusability(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AccountDeletionController;
export default _default;
//# sourceMappingURL=account-deletion.controller.d.ts.map