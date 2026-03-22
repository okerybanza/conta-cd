export interface CreateExpenseData {
    expenseDate: string | Date;
    supplierId?: string;
    supplierName?: string;
    categoryId?: string;
    accountId?: string;
    amountHt: number;
    taxRate?: number;
    amountTtc: number;
    paymentMethod: string;
    paymentDate?: string | Date;
    status?: string;
    reference?: string;
    description?: string;
    notes?: string;
    currency?: string;
    reason?: string;
    mobileMoneyProvider?: string;
    mobileMoneyNumber?: string;
    transactionReference?: string;
    bankName?: string;
    checkNumber?: string;
    cardLastFour?: string;
}
export interface UpdateExpenseData extends Partial<CreateExpenseData> {
    reason?: string;
}
export interface ExpenseFilters {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
    categoryId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class ExpenseService {
    /**
     * Générer le numéro de dépense
     */
    private generateExpenseNumber;
    /**
     * Calculer les totaux d'une dépense
     */
    private calculateTotals;
    /**
     * Créer une dépense
     */
    create(companyId: string, userId: string, data: CreateExpenseData): Promise<any>;
    /**
     * Créer l'écriture comptable pour une dépense
     */
    private createJournalEntryForExpense;
    /**
     * Obtenir une dépense par ID
     */
    getById(companyId: string, expenseId: string): Promise<{
        id: any;
        companyId: any;
        expenseNumber: any;
        expenseDate: string | null;
        supplierId: any;
        supplierName: any;
        categoryId: any;
        accountId: any;
        amountHt: number;
        taxRate: number | undefined;
        taxAmount: number | undefined;
        amountTtc: number;
        paymentMethod: any;
        paymentDate: string | undefined;
        status: any;
        reference: any;
        description: any;
        notes: any;
        currency: any;
        mobileMoneyProvider: any;
        mobileMoneyNumber: any;
        transactionReference: any;
        bankName: any;
        checkNumber: any;
        cardLastFour: any;
        supplier: {
            id: any;
            name: any;
            businessName: any;
        } | undefined;
        category: {
            id: any;
            name: any;
        } | undefined;
        account: {
            id: any;
            code: any;
            name: any;
        } | undefined;
        creator: {
            id: any;
            firstName: any;
            lastName: any;
            email: any;
        } | undefined;
        createdAt: string | undefined;
        updatedAt: string | undefined;
    }>;
    /**
     * Lister les dépenses
     */
    list(companyId: string, filters?: ExpenseFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Mettre à jour une dépense
     */
    update(companyId: string, expenseId: string, userId: string, data: UpdateExpenseData): Promise<any>;
    /**
     * Supprimer une dépense
     */
    delete(companyId: string, expenseId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Dupliquer une dépense
     */
    duplicate(companyId: string, expenseId: string, userId: string): Promise<any>;
}
declare const _default: ExpenseService;
export default _default;
//# sourceMappingURL=expense.service.d.ts.map