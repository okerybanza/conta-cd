import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ExpenseApprovalController {
    /**
     * POST /api/v1/expenses/:id/approval/request
     * Demander une approbation pour une dépense
     */
    requestApproval(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/expenses/approvals/:id/approve
     * Approuver une dépense
     */
    approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/expenses/approvals/:id/reject
     * Rejeter une dépense
     */
    reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/approvals/pending
     * Lister les approbations en attente pour l'utilisateur connecté
     */
    listPending(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/approvals/:id
     * Obtenir une approbation par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/:id/approvals
     * Obtenir l'historique d'approbation d'une dépense
     */
    getByExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/expenses/approval-rules
     * Créer une règle d'approbation
     */
    createRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/approval-rules
     * Lister les règles d'approbation
     */
    listRules(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/approval-rules/:id
     * Obtenir une règle par ID
     */
    getRuleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/expenses/approval-rules/:id
     * Mettre à jour une règle
     */
    updateRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/expenses/approval-rules/:id
     * Supprimer une règle
     */
    deleteRule(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ExpenseApprovalController;
export default _default;
//# sourceMappingURL=expenseApproval.controller.d.ts.map