import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ContractController {
    /**
     * POST /api/v1/contracts
     * Créer un contrat
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/contracts/:id
     * Obtenir un contrat
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/contracts
     * Lister les contrats
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/contracts/:id
     * Mettre à jour un contrat
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/contracts/:id/sign/company
     * Signer un contrat (par l'entreprise)
     */
    signByCompany(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/contracts/:id/sign/accountant
     * Signer un contrat (par l'expert)
     */
    signByAccountant(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/contracts/:id
     * Annuler un contrat
     */
    cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/contracts/templates
     * Obtenir les templates de contrats
     */
    getTemplates(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ContractController;
export default _default;
//# sourceMappingURL=contract.controller.d.ts.map