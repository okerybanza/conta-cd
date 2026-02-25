export interface CreateCreditNoteData {
    invoiceId: string;
    amount: number;
    taxAmount?: number;
    reason: string;
    reference?: string;
    notes?: string;
    creditNoteDate?: Date;
    currency?: string;
    templateId?: string;
    footerText?: string;
    returnStock?: boolean;
    lines?: CreditNoteLineInput[];
}
export interface UpdateCreditNoteData {
    reason?: string;
    reference?: string;
    notes?: string;
    footerText?: string;
    status?: 'draft' | 'sent' | 'applied' | 'cancelled';
    returnStock?: boolean;
}
export interface CreditNoteLineInput {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}
export declare class CreditNoteService {
    /**
     * Générer le numéro d'avoir suivant
     */
    generateCreditNoteNumber(companyId: string): Promise<string>;
    /**
     * Calculer les totaux d'un avoir
     */
    calculateTotals(amount: number, taxAmount?: number): {
        amount: number;
        taxAmount: number;
        totalAmount: number;
    };
    private calculateTotalsFromLines;
    /**
     * Créer un avoir
     */
    create(companyId: string, userId: string, data: CreateCreditNoteData): Promise<any>;
    /**
     * Créer l'écriture comptable pour un avoir (contrepassation)
     */
    private createJournalEntryForCreditNote;
    /**
     * Obtenir un avoir par ID
     */
    getById(companyId: string, creditNoteId: string): Promise<any>;
    /**
     * Lister les avoirs
     */
    list(companyId: string, filters?: {
        invoiceId?: string;
        status?: string;
        page?: number;
        limit?: number;
        search?: string;
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
     * Mettre à jour un avoir
     */
    update(companyId: string, creditNoteId: string, userId: string, data: UpdateCreditNoteData): Promise<any>;
    /**
     * Supprimer (soft delete) un avoir
     */
    delete(companyId: string, creditNoteId: string): Promise<void>;
    /**
     * Appliquer un avoir à une facture (réduire le montant dû)
     */
    applyCreditNote(companyId: string, creditNoteId: string, userId: string): Promise<any>;
}
declare const _default: CreditNoteService;
export default _default;
//# sourceMappingURL=creditNote.service.d.ts.map