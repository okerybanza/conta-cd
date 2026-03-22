import { InvoiceTemplateData } from './template.service';
export declare class PDFService {
    private browserInstance;
    private browserPromise;
    private readonly circuitBreaker;
    constructor();
    private getBrowser;
    private launchBrowser;
    closeBrowser(): Promise<void>;
    generatePDFFromHTML(html: string, options?: {
        format?: string;
        margin?: any;
    }): Promise<Buffer>;
    generateInvoicePDF(templateId: string, templateData: InvoiceTemplateData): Promise<Buffer>;
}
declare const _default: PDFService;
export default _default;
//# sourceMappingURL=pdf.service.d.ts.map