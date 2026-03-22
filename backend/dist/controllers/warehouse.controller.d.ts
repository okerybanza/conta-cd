import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class WarehouseController {
    /**
     * POST /api/v1/warehouses
     * Créer un entrepôt
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/warehouses
     * Lister les entrepôts
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/warehouses/:id
     * Obtenir un entrepôt par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/warehouses/:id
     * Mettre à jour un entrepôt
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/warehouses/:id
     * Supprimer un entrepôt
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/warehouses/default
     * Obtenir l'entrepôt par défaut
     */
    getDefault(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: WarehouseController;
export default _default;
//# sourceMappingURL=warehouse.controller.d.ts.map