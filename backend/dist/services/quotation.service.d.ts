export interface QuotationLineData {
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}
export interface CreateQuotationData {
    customerId: string;
    quotationDate?: Date;
    expirationDate?: Date;
    reference?: string;
    poNumber?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    transportFees?: number;
    platformFees?: number;
    currency?: string;
    templateId?: string;
    notes?: string;
    paymentTerms?: string;
    footerText?: string;
    lines: QuotationLineData[];
}
export interface UpdateQuotationData extends Partial<CreateQuotationData> {
    lines?: QuotationLineData[];
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}
export interface QuotationFilters {
    customerId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class QuotationService {
    private generateQuotationNumber;
    private calculateTotals;
    create(companyId: string, userId: string, data: CreateQuotationData): Promise<any>;
    getById(companyId: string, quotationId: string): Promise<any>;
    list(companyId: string, filters?: QuotationFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    update(companyId: string, quotationId: string, userId: string, data: UpdateQuotationData): Promise<any>;
    delete(companyId: string, quotationId: string): Promise<void>;
    convertToInvoice(companyId: string, quotationId: string, userId: string): Promise<{
        quotation: any;
        invoice: any;
    }>;
    checkExpiredQuotations(companyId?: string): Promise<any>;
}
declare const _default: QuotationService;
export default _default;
//# sourceMappingURL=quotation.service.d.ts.map