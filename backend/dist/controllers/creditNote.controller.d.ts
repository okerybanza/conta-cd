import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class CreditNoteController {
    /**
     * Créer un avoir
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtenir un avoir par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Lister les avoirs
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Mettre à jour un avoir
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Supprimer un avoir
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Appliquer un avoir à une facture
     */
    apply(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: CreditNoteController;
export default _default;
//# sourceMappingURL=creditNote.controller.d.ts.map