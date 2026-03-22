export interface RequestApprovalData {
    comments?: string;
}
export interface ApproveExpenseData {
    comments?: string;
}
export interface RejectExpenseData {
    reason: string;
    comments?: string;
}
export declare class ExpenseApprovalService {
    /**
     * Demander une approbation pour une dépense
     */
    requestApproval(companyId: string, expenseId: string, userId: string, data?: RequestApprovalData): Promise<any>;
    /**
     * Approuver une dépense
     */
    approve(companyId: string, approvalId: string, approverId: string, data?: ApproveExpenseData): Promise<any>;
    /**
     * Rejeter une dépense
     */
    reject(companyId: string, approvalId: string, rejectorId: string, data: RejectExpenseData): Promise<any>;
    /**
     * Lister les approbations en attente pour un utilisateur
     */
    listPendingForUser(companyId: string, userId: string): Promise<any[]>;
    /**
     * Obtenir une approbation par ID
     */
    getById(companyId: string, approvalId: string): Promise<any>;
    /**
     * Obtenir l'historique d'approbation d'une dépense
     */
    getByExpense(companyId: string, expenseId: string): Promise<any>;
}
declare const _default: ExpenseApprovalService;
export default _default;
//# sourceMappingURL=expenseApproval.service.d.ts.map