export type ExportFormat = 'pdf' | 'excel' | 'xml' | 'csv';
export interface FiscalControlExport {
    invoices: any[];
    expenses: any[];
    journalEntries: any[];
    balanceSheet: any;
    generalLedger: any[];
}
export declare class FiscalExportService {
    /**
     * Exporter la déclaration TVA
     */
    exportVATDeclaration(companyId: string, period: string, // Format: "2025-01"
    format: ExportFormat): Promise<Buffer | string>;
    /**
     * Générer la déclaration TVA en PDF
     */
    private generateVATDeclarationPDF;
    /**
     * Générer la déclaration TVA en Excel (CSV)
     */
    private generateVATDeclarationExcel;
    /**
     * Générer la déclaration TVA en XML
     */
    private generateVATDeclarationXML;
    /**
     * Échapper les caractères XML
     */
    private escapeXml;
    /**
     * Exporter pour contrôle fiscal
     */
    exportFiscalControl(companyId: string, period: {
        startDate: Date;
        endDate: Date;
    }, format: 'excel' | 'csv'): Promise<string>;
}
declare const _default: FiscalExportService;
export default _default;
//# sourceMappingURL=fiscalExport.service.d.ts.map