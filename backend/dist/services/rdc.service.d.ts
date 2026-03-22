export interface RDCInvoiceData {
    nif: string;
    def?: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalTTC: number;
    currency?: string;
}
export declare class RDCService {
    generateQRCodeData(data: RDCInvoiceData): string;
    generateQRCodeBase64(data: RDCInvoiceData): Promise<string>;
    generateQRCodeBuffer(data: RDCInvoiceData): Promise<Buffer>;
    validateRDCInvoice(company: any, invoice: any): {
        valid: boolean;
        errors: string[];
    };
}
declare const _default: RDCService;
export default _default;
//# sourceMappingURL=rdc.service.d.ts.map