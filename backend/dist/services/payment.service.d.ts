export interface CreatePaymentData {
    invoiceId: string;
    amount: number;
    currency?: string;
    paymentDate?: Date;
    paymentMethod: string;
    mobileMoneyProvider?: string;
    mobileMoneyNumber?: string;
    transactionReference?: string;
    bankName?: string;
    checkNumber?: string;
    cardLastFour?: string;
    reference?: string;
    notes?: string;
    status?: string;
    reason?: string;
}
export interface UpdatePaymentData extends Partial<CreatePaymentData> {
    reason?: string;
}
export interface PaymentFilters {
    invoiceId?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class PaymentService {
    private static readonly HIGH_VALUE_PAYMENT_THRESHOLD;
    private updateInvoiceStatus;
    create(companyId: string, userId: string, data: CreatePaymentData): Promise<any>;
    private createJournalEntryForPayment;
    getById(companyId: string, paymentId: string): Promise<any>;
    list(companyId: string, filters?: PaymentFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    update(companyId: string, paymentId: string, data: UpdatePaymentData): Promise<any>;
    delete(companyId: string, paymentId: string): Promise<{
        success: boolean;
    }>;
    getByInvoice(companyId: string, invoiceId: string): Promise<any>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service.d.ts.map