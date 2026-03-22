import { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData } from './invoiceHelper.service';
export { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData };
export declare class InvoiceCoreService {
    /**
     * Obtenir l'ID réel à partir d'un identifiant (UUID ou numéro de facture)
     */
    getInvoiceId(companyId: string, identifier: string): Promise<string>;
    /**
     * Obtenir une facture par ID
     */
    getById(companyId: string, invoiceId: string): Promise<any>;
    /**
     * Lister les factures
     */
    list(companyId: string, filters?: InvoiceFilters): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
}
declare const _default: InvoiceCoreService;
export default _default;
//# sourceMappingURL=invoiceCore.service.d.ts.map