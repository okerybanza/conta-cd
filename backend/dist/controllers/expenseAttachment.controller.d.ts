import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ExpenseAttachmentController {
    /**
     * POST /api/v1/expenses/:id/attachments
     * Upload un justificatif
     */
    upload(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/:id/attachments
     * Lister les justificatifs d'une dépense
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/expenses/:id/attachments/:filename
     * Télécharger un justificatif
     */
    download(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/expenses/:id/attachments/:attachmentId
     * Supprimer un justificatif
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ExpenseAttachmentController;
export default _default;
//# sourceMappingURL=expenseAttachment.controller.d.ts.map