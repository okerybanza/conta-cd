export interface BankTransactionImport {
    date: Date;
    valueDate?: Date;
    description: string;
    reference?: string;
    amount: number;
    balance?: number;
}
export interface BankStatementImport {
    accountId: string;
    statementNumber: string;
    startDate: Date;
    endDate: Date;
    openingBalance: number;
    closingBalance: number;
    transactions: BankTransactionImport[];
}
export interface ReconciliationMatch {
    bankTransactionId: string;
    accountingTransactionId: string;
    matchType: 'automatic' | 'manual';
    confidence: number;
    matchedAmount: number;
    difference?: number;
}
export declare class BankReconciliationService {
    /**
     * Parser CSV simple pour relevés bancaires
     * Format attendu: Date,Description,Montant,Reference (optionnel)
     */
    parseCSV(csvContent: string): BankTransactionImport[];
    /**
     * Parser une ligne CSV en gérant les guillemets
     */
    private parseCSVLine;
    /**
     * Importer un relevé bancaire
     */
    importBankStatement(companyId: string, accountId: string, statementData: BankStatementImport): Promise<any>;
    /**
     * Rapprocher automatiquement un relevé bancaire
     */
    reconcileStatement(statementId: string): Promise<void>;
    /**
     * Trouver la meilleure correspondance pour une transaction bancaire
     */
    private findBestMatch;
    /**
     * Obtenir un relevé bancaire avec ses transactions
     */
    getBankStatement(statementId: string, companyId: string): Promise<any>;
    /**
     * Lister les relevés bancaires d'une entreprise
     */
    listBankStatements(companyId: string, accountId?: string): Promise<any[]>;
    /**
     * Rapprocher manuellement une transaction
     */
    manualReconcile(bankTransactionId: string, accountingTransactionId: string, accountingTransactionType: string): Promise<void>;
}
declare const _default: BankReconciliationService;
export default _default;
//# sourceMappingURL=bankReconciliation.service.d.ts.map