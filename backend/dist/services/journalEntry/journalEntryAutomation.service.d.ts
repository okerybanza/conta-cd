export declare class JournalEntryAutomationService {
    /**
     * Créer une écriture automatique pour une facture (vente)
     */
    createForInvoice(companyId: string, invoiceId: string, invoiceData: {
        invoiceNumber: string;
        invoiceDate: Date;
        customerId: string;
        customerName: string;
        amountHt: number;
        taxAmount: number;
        amountTtc: number;
        currency: string;
        createdBy?: string;
    }): Promise<any>;
    /**
     * S'assurer qu'il existe une écriture pour une facture (idempotent)
     */
    ensureForInvoice(companyId: string, invoiceId: string, invoiceData: any): Promise<any>;
    /**
     * Créer une écriture automatique pour un avoir (credit note)
     */
    createForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any): Promise<any>;
    /**
     * S'assurer qu'il existe une écriture pour un avoir
     */
    ensureForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any): Promise<any>;
    /**
     * Créer une écriture automatique pour une dépense
     */
    createForExpense(companyId: string, expenseId: string, expenseData: any): Promise<any>;
    /**
     * S'assurer qu'il existe une écriture pour une dépense
     */
    ensureForExpense(companyId: string, expenseId: string, expenseData: any): Promise<any>;
    /**
     * Créer une écriture automatique pour un paiement
     */
    createForPayment(companyId: string, paymentId: string, paymentData: any): Promise<any>;
    /**
     * Supprimer les écritures liées à une facture
     */
    deleteForInvoice(companyId: string, invoiceId: string): Promise<void>;
}
declare const _default: JournalEntryAutomationService;
export default _default;
//# sourceMappingURL=journalEntryAutomation.service.d.ts.map