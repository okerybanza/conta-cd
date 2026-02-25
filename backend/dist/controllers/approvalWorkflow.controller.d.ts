/**
 * ACCT-006: Workflow d'approbation générique — API
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ApprovalWorkflowController {
    /** POST /api/v1/approval-requests — Créer une demande d'approbation */
    request(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** POST /api/v1/approval-requests/:id/approve — Approuver */
    approve(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** POST /api/v1/approval-requests/:id/reject — Rejeter */
    reject(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** GET /api/v1/approval-requests — Lister (filtres: status, entityType, requestedBy) */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ApprovalWorkflowController;
export default _default;
//# sourceMappingURL=approvalWorkflow.controller.d.ts.map