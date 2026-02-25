export declare class InvoiceDeleteService {
    /**
     * Supprimer une facture
     */
    delete(companyId: string, invoiceId: string, userId?: string, justification?: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: InvoiceDeleteService;
export default _default;
//# sourceMappingURL=invoiceDelete.service.d.ts.map