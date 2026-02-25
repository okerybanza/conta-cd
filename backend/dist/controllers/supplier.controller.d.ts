import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class SupplierController {
    /**
     * POST /api/v1/suppliers
     * Créer un fournisseur
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/suppliers
     * Lister les fournisseurs
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/suppliers/:id
     * Obtenir un fournisseur par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/suppliers/:id
     * Mettre à jour un fournisseur
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/suppliers/:id
     * Supprimer un fournisseur
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: SupplierController;
export default _default;
//# sourceMappingURL=supplier.controller.d.ts.map