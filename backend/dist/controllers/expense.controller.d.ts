import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ExpenseController {
    /**
     * POST /api/v1/expenses
     * Créer une dépense
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses
     * Lister les dépenses
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/:id
     * Obtenir une dépense par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/expenses/:id
     * Mettre à jour une dépense
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/expenses/:id
     * Supprimer une dépense
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/expenses/:id/duplicate
     * Dupliquer une dépense
     */
    duplicate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ExpenseController;
export default _default;
//# sourceMappingURL=expense.controller.d.ts.map