import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ExpenseCategoryController {
    /**
     * POST /api/v1/expense-categories
     * Créer une catégorie
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expense-categories
     * Lister les catégories
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expense-categories/:id
     * Obtenir une catégorie par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/expense-categories/:id
     * Mettre à jour une catégorie
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/expense-categories/:id
     * Supprimer une catégorie
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ExpenseCategoryController;
export default _default;
//# sourceMappingURL=expenseCategory.controller.d.ts.map