export interface RecurringInvoiceLineData {
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}
export interface CreateRecurringInvoiceData {
    customerId: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval?: number;
    startDate: Date;
    endDate?: Date;
    dueDateDays?: number;
    currency?: string;
    reference?: string;
    poNumber?: string;
    notes?: string;
    paymentTerms?: string;
    lines: RecurringInvoiceLineData[];
    transportFees?: number;
    platformFees?: number;
    autoSend?: boolean;
    sendToCustomer?: boolean;
}
export interface UpdateRecurringInvoiceData extends Partial<CreateRecurringInvoiceData> {
    isActive?: boolean;
}
export declare class RecurringInvoiceService {
    /**
     * Calculer la prochaine date d'exécution
     */
    private calculateNextRunDate;
    /**
     * Calculer les totaux
     */
    private calculateTotals;
    /**
     * Créer une facture récurrente
     */
    create(companyId: string, userId: string, data: CreateRecurringInvoiceData): Promise<any>;
    /**
     * Obtenir une facture récurrente par ID
     */
    getById(companyId: string, recurringInvoiceId: string): Promise<any>;
    /**
     * Lister les factures récurrentes
     */
    list(companyId: string, filters?: {
        isActive?: boolean;
        customerId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Mettre à jour une facture récurrente
     */
    update(companyId: string, recurringInvoiceId: string, data: UpdateRecurringInvoiceData): Promise<any>;
    /**
     * Supprimer (soft delete) une facture récurrente
     */
    delete(companyId: string, recurringInvoiceId: string): Promise<void>;
    /**
     * Générer la prochaine facture depuis une facture récurrente
     */
    generateNextInvoice(recurringInvoiceId: string): Promise<string | null>;
    /**
     * Traiter toutes les factures récurrentes qui doivent être générées
     * Appelé par le scheduler quotidien
     */
    processRecurringInvoices(): Promise<Array<{
        recurringInvoiceId: string;
        invoiceId: string | null;
        success: boolean;
        error?: string;
    }>>;
    /**
     * Obtenir l'historique des factures générées depuis une facture récurrente
     */
    getGenerationHistory(companyId: string, recurringInvoiceId: string): Promise<any>;
}
declare const _default: RecurringInvoiceService;
export default _default;
//# sourceMappingURL=recurringInvoice.service.d.ts.map