export interface CreateAttachmentData {
    expenseId: string;
    companyId: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedBy: string;
}
export declare class ExpenseAttachmentService {
    /**
     * Créer un justificatif
     */
    create(data: CreateAttachmentData): Promise<any>;
    /**
     * Lister les justificatifs d'une dépense
     */
    list(companyId: string, expenseId: string): Promise<any>;
    /**
     * Obtenir un justificatif par ID
     */
    getById(companyId: string, attachmentId: string): Promise<any>;
    /**
     * Obtenir un justificatif par filename
     */
    getByFilename(companyId: string, expenseId: string, filename: string): Promise<any>;
    /**
     * Supprimer un justificatif
     */
    delete(companyId: string, attachmentId: string): Promise<any>;
    /**
     * Supprimer tous les justificatifs d'une dépense
     */
    deleteByExpense(companyId: string, expenseId: string): Promise<void>;
}
declare const _default: ExpenseAttachmentService;
export default _default;
//# sourceMappingURL=expenseAttachment.service.d.ts.map