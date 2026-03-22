export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'cancelled';
/**
 * Service de validation des factures
 * Assure la cohérence des données et des transitions de statut
 */
export declare class InvoiceValidationService {
    /**
     * Matrice des transitions de statut autorisées
     */
    private static readonly ALLOWED_TRANSITIONS;
    /**
     * Vérifier si une transition de statut est autorisée
     */
    static validateStatusTransition(oldStatus: InvoiceStatus, newStatus: InvoiceStatus): void;
    /**
     * Vérifier si une facture peut être modifiée selon son statut
     */
    static validateCanModify(status: InvoiceStatus): void;
    /**
     * Vérifier si une facture peut être supprimée selon son statut
     */
    static validateCanDelete(status: InvoiceStatus): void;
    /**
     * Valider les calculs financiers d'une facture
     * Vérifie la cohérence HT/TTC et les arrondis
     */
    static validateFinancialCalculations(lines: Array<{
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }>, transportFees: number | undefined, platformFees: number | undefined, expectedSubtotal: number, expectedTaxAmount: number, expectedTotalAmount: number, tolerance?: number): void;
    /**
     * Valider les dates d'une facture
     */
    static validateDates(invoiceDate: Date, dueDate?: Date): void;
    /**
     * Valider qu'un montant de paiement ne dépasse pas le solde restant
     */
    static validatePaymentAmount(paymentAmount: number, totalAmount: number, paidAmount: number): void;
    /**
     * Valider la cohérence entre le statut et les montants payés
     */
    static validateStatusConsistency(status: InvoiceStatus, totalAmount: number, paidAmount: number): void;
}
export default InvoiceValidationService;
//# sourceMappingURL=invoiceValidation.service.d.ts.map