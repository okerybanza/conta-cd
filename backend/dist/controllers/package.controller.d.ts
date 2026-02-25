import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class PackageController {
    /**
     * GET /api/v1/packages
     * Liste tous les packages actifs
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/packages/:id
     * Obtenir un package par ID
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/packages/code/:code
     * Obtenir un package par code
     */
    getByCode(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/packages
     * Créer un nouveau package (Super Admin uniquement)
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/packages/:id
     * Mettre à jour un package (Super Admin uniquement)
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/packages/:id
     * Supprimer un package (Super Admin uniquement)
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/packages/:id/subscriptions-count
     * Obtenir le nombre de subscriptions actives pour un package
     */
    getSubscriptionsCount(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: PackageController;
export default _default;
//# sourceMappingURL=package.controller.d.ts.map