/**
 * ACCT-006: Moteur de workflow d'approbation (fondation)
 * Demande d'approbation générique pour tout type d'entité (invoice, journal_entry, etc.).
 */
export type ApprovalEntityType = 'invoice' | 'journal_entry' | 'payment' | 'expense' | string;
export interface RequestApprovalInput {
    companyId: string;
    entityType: ApprovalEntityType;
    entityId: string;
    requestedBy: string;
    comments?: string;
}
export interface ApproveRejectInput {
    companyId: string;
    requestId: string;
    userId: string;
    comments?: string;
    rejectionReason?: string;
}
export declare class ApprovalWorkflowService {
    /**
     * Créer une demande d'approbation pour une entité.
     * Une seule demande en attente par (company, entity_type, entity_id).
     */
    request(input: RequestApprovalInput): Promise<any>;
    /**
     * Approuver une demande (un autre utilisateur que le demandeur doit approuver).
     */
    approve(input: ApproveRejectInput): Promise<any>;
    /**
     * Rejeter une demande (avec motif).
     */
    reject(input: ApproveRejectInput): Promise<any>;
    /**
     * Récupérer la demande en attente pour une entité, s'il y en a une.
     */
    getPending(companyId: string, entityType: ApprovalEntityType, entityId: string): Promise<any>;
    /**
     * Lister les demandes (par company, optionnellement par statut ou type).
     */
    list(companyId: string, filters?: {
        status?: string;
        entityType?: string;
        requestedBy?: string;
    }): Promise<any>;
}
declare const _default: ApprovalWorkflowService;
export default _default;
//# sourceMappingURL=approvalWorkflow.service.d.ts.map