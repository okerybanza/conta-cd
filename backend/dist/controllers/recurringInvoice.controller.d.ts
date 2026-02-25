import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class RecurringInvoiceController {
    /**
     * Créer une facture récurrente
     * POST /api/v1/recurring-invoices
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtenir une facture récurrente
     * GET /api/v1/recurring-invoices/:id
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Lister les factures récurrentes
     * GET /api/v1/recurring-invoices
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Mettre à jour une facture récurrente
     * PUT /api/v1/recurring-invoices/:id
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Supprimer une facture récurrente
     * DELETE /api/v1/recurring-invoices/:id
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Générer manuellement la prochaine facture
     * POST /api/v1/recurring-invoices/:id/generate
     */
    generate(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtenir l'historique des factures générées
     * GET /api/v1/recurring-invoices/:id/history
     */
    getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: RecurringInvoiceController;
export default _default;
//# sourceMappingURL=recurringInvoice.controller.d.ts.map