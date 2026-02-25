export interface InvoiceLineData {
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}
export interface CreateInvoiceData {
    customerId: string;
    invoiceDate?: Date;
    dueDate?: Date;
    reference?: string;
    poNumber?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    transportFees?: number;
    platformFees?: number;
    currency?: string;
    templateId?: string;
    reason?: string;
    notes?: string;
    paymentTerms?: string;
    footerText?: string;
    lines: InvoiceLineData[];
    recurringInvoiceId?: string;
}
export interface UpdateInvoiceData {
    reason?: string;
    lines?: InvoiceLineData[];
}
export interface InvoiceFilters {
    customerId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class InvoiceHelperService {
    /**
     * Générer le numéro de facture
     */
    generateInvoiceNumber(companyId: string): Promise<string>;
    /**
     * Calculer les totaux d'une facture
     *
     * Retourne des nombres natifs pour simplifier l'utilisation côté services
     * et éviter les soucis de typage avec Decimal dans les tests.
     */
    calculateTotals(lines: InvoiceLineData[], transportFees?: number, platformFees?: number): {
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
    };
}
declare const _default: InvoiceHelperService;
export default _default;
//# sourceMappingURL=invoiceHelper.service.d.ts.map