import { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData, InvoiceLineData } from './invoice/invoiceHelper.service';
export { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData, InvoiceLineData };
export declare class InvoiceService {
    private generateInvoiceNumber;
    private calculateTotals;
    create(companyId: string, userId: string, data: CreateInvoiceData): Promise<any>;
    getInvoiceId(companyId: string, identifier: string): Promise<string>;
    getById(companyId: string, invoiceId: string): Promise<any>;
    list(companyId: string, filters?: InvoiceFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    updateStatus(companyId: string, invoiceId: string, status: string, userId?: string, justification?: string): Promise<any>;
    createJournalEntryForInvoice(companyId: string, invoice: any, userId?: string): Promise<void>;
    update(companyId: string, invoiceId: string, data: UpdateInvoiceData, userId?: string): Promise<any>;
    delete(companyId: string, invoiceId: string, userId?: string, justification?: string): Promise<{
        success: boolean;
    }>;
    duplicate(companyId: string, invoiceId: string, userId: string): Promise<any>;
}
declare const _default: InvoiceService;
export default _default;
//# sourceMappingURL=invoice.service.d.ts.map