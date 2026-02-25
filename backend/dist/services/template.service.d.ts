export interface InvoiceTemplateData {
    companyName: string;
    companyLogo?: string;
    platformPdfLogo?: string;
    companyAddress?: string;
    companyCity?: string;
    companyCountry?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyNIF?: string;
    companyRCCM?: string;
    companyDEF?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    reference?: string;
    currency: string;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    isRDCNormalized?: boolean;
    clientName: string;
    clientType: 'particulier' | 'entreprise';
    clientBusinessName?: string;
    clientAddress?: string;
    clientCity?: string;
    clientCountry?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientNIF?: string;
    clientRCCM?: string;
    shippingAddress?: string;
    items: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        total: number;
    }>;
    subtotalHT: number;
    hasTransportFees?: boolean;
    transportFees?: number;
    hasPlatformFees?: boolean;
    platformFees?: number;
    totalTVA: number;
    totalTTC: number;
    paidAmount?: number;
    remainingBalance?: number;
    qrCode?: string;
    qrCodeData?: string;
    notes?: string;
    paymentTerms?: string;
}
export declare class TemplateService {
    private templatesPath;
    constructor();
    getAvailableTemplates(): string[];
    private loadTemplate;
    compileTemplate(templateId: string, data: InvoiceTemplateData): string;
    prepareInvoiceData(invoice: any, company: any, customer: any, qrCode?: string): Promise<InvoiceTemplateData>;
    prepareQuotationData(quotation: any, company: any, customer: any): Promise<InvoiceTemplateData>;
    loadPayslipTemplate(): string;
    preparePayslipData(payroll: any, company: any, employee: any): Promise<any>;
    compilePayslipTemplate(data: any): string;
}
declare const _default: TemplateService;
export default _default;
//# sourceMappingURL=template.service.d.ts.map