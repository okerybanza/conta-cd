export interface CreateEmployeeDocumentData {
    employeeId: string;
    documentType: string;
    name: string;
    description?: string;
    fileId: string;
    expiryDate?: Date | string;
    notes?: string;
}
export interface UpdateEmployeeDocumentData {
    documentType?: string;
    name?: string;
    description?: string;
    fileId?: string;
    expiryDate?: Date | string | null;
    notes?: string;
}
export interface EmployeeDocumentFilters {
    employeeId?: string;
    documentType?: string;
    isExpired?: boolean;
    page?: number;
    limit?: number;
}
export declare class EmployeeDocumentService {
    /**
     * Vérifier et mettre à jour le statut d'expiration
     */
    private checkExpiration;
    /**
     * Créer un document employé
     */
    create(companyId: string, data: CreateEmployeeDocumentData): Promise<any>;
    /**
     * Obtenir un document par ID
     */
    getById(companyId: string, documentId: string): Promise<any>;
    /**
     * Lister les documents
     */
    list(companyId: string, filters?: EmployeeDocumentFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Mettre à jour un document
     */
    update(companyId: string, documentId: string, data: UpdateEmployeeDocumentData): Promise<any>;
    /**
     * Supprimer un document (soft delete)
     */
    delete(companyId: string, documentId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Obtenir les documents expirés ou expirant bientôt
     */
    getExpiringDocuments(companyId: string, daysBeforeExpiry?: number): Promise<any>;
    /**
     * Obtenir les documents expirés
     */
    getExpiredDocuments(companyId: string): Promise<any>;
}
declare const _default: EmployeeDocumentService;
export default _default;
//# sourceMappingURL=employeeDocument.service.d.ts.map