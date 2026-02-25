export interface AccountingReportFilters {
    startDate?: Date | string;
    endDate?: Date | string;
    accountId?: string;
    accountCode?: string;
    customerId?: string;
    supplierId?: string;
}
export interface SalesJournalEntry {
    date: Date;
    invoiceNumber: string;
    customerName: string;
    customerId: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
    currency: string;
}
export interface SalesJournalReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    entries: SalesJournalEntry[];
    totals: {
        totalDebit: number;
        totalCredit: number;
    };
}
export interface PurchaseJournalEntry {
    date: Date;
    expenseNumber: string;
    supplierName: string;
    supplierId?: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
    currency: string;
}
export interface PurchaseJournalReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    entries: PurchaseJournalEntry[];
    totals: {
        totalDebit: number;
        totalCredit: number;
    };
}
export interface GeneralLedgerEntry {
    date: Date;
    entryNumber: string;
    reference?: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    currency: string;
}
export interface GeneralLedgerReport {
    account: {
        id: string;
        code: string;
        name: string;
        type: string;
    };
    period: {
        startDate: Date;
        endDate: Date;
    };
    openingBalance: number;
    entries: GeneralLedgerEntry[];
    closingBalance: number;
    totals: {
        totalDebit: number;
        totalCredit: number;
    };
}
export interface TrialBalanceAccount {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
    balance: number;
}
export interface TrialBalanceReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    accounts: TrialBalanceAccount[];
    totals: {
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
        closingDebit: number;
        closingCredit: number;
        balance: number;
    };
}
export interface AgedBalanceEntry {
    id: string;
    name: string;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    total: number;
    currency: string;
}
export interface AgedBalanceReport {
    type: 'receivables' | 'payables';
    period: {
        asOfDate: Date;
    };
    entries: AgedBalanceEntry[];
    totals: {
        current: number;
        days30: number;
        days60: number;
        days90: number;
        total: number;
    };
}
export declare class AccountingReportsService {
    /**
     * Helper pour obtenir le nom d'un client
     */
    private getCustomerName;
    /**
     * Journal des Ventes - Liste des écritures comptables liées aux factures
     */
    generateSalesJournal(companyId: string, filters: AccountingReportFilters): Promise<SalesJournalReport>;
    /**
     * Journal des Achats - Liste des écritures comptables liées aux dépenses
     */
    generatePurchaseJournal(companyId: string, filters: AccountingReportFilters): Promise<PurchaseJournalReport>;
    /**
     * Grand Livre Général - Toutes les écritures pour un compte spécifique
     */
    generateGeneralLedger(companyId: string, accountId: string, filters: AccountingReportFilters): Promise<GeneralLedgerReport>;
    /**
     * Balance Générale - Liste de tous les comptes avec leurs soldes
     */
    generateTrialBalance(companyId: string, filters: AccountingReportFilters): Promise<TrialBalanceReport>;
    /**
     * Balance Âgée - Créances clients ou dettes fournisseurs par période d'échéance
     */
    generateAgedBalance(companyId: string, type: 'receivables' | 'payables', asOfDate?: Date): Promise<AgedBalanceReport>;
}
declare const _default: AccountingReportsService;
export default _default;
//# sourceMappingURL=accountingReports.service.d.ts.map