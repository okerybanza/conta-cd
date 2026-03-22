export interface CreateExpenseCategoryData {
    name: string;
    description?: string;
    accountId?: string;
}
export interface UpdateExpenseCategoryData extends Partial<CreateExpenseCategoryData> {
    isActive?: boolean;
}
export declare class ExpenseCategoryService {
    /**
     * Créer une catégorie de dépense
     */
    create(companyId: string, data: CreateExpenseCategoryData): Promise<any>;
    /**
     * Obtenir une catégorie par ID
     */
    getById(companyId: string, categoryId: string): Promise<any>;
    /**
     * Lister les catégories
     */
    list(companyId: string, includeInactive?: boolean): Promise<any>;
    /**
     * Mettre à jour une catégorie
     */
    update(companyId: string, categoryId: string, data: UpdateExpenseCategoryData): Promise<any>;
    /**
     * Supprimer une catégorie (soft delete via isActive)
     */
    delete(companyId: string, categoryId: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: ExpenseCategoryService;
export default _default;
//# sourceMappingURL=expenseCategory.service.d.ts.map