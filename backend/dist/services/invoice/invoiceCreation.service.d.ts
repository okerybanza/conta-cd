import { CreateInvoiceData } from './invoiceHelper.service';
export declare class InvoiceCreationService {
    /**
     * Créer une facture
     */
    create(companyId: string, userId: string, data: CreateInvoiceData): Promise<any>;
    /**
     * Dupliquer une facture
     */
    duplicate(companyId: string, invoiceId: string, userId: string): Promise<any>;
}
declare const _default: InvoiceCreationService;
export default _default;
//# sourceMappingURL=invoiceCreation.service.d.ts.map