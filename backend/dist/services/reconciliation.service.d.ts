export interface ReconciliationPeriod {
    startDate: Date;
    endDate: Date;
}
export interface InvoiceReconciliationResult {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    invoiceDate: Date;
    dueDate: Date;
    expectedAmount: number;
    totalPayments: number;
    difference: number;
    isReconciled: boolean;
    lastReconciledAt: Date | null;
    issues: string[];
}
export interface JournalEntryReconciliationResult {
    transactionId: string;
    transactionType: 'invoice' | 'payment' | 'expense' | 'payroll';
    transactionDate: Date;
    transactionAmount: number;
    journalEntryId: string | null;
    journalEntryNumber: string | null;
    isReconciled: boolean;
    issues: string[];
}
export interface ReconciliationReport {
    period: ReconciliationPeriod;
    generatedAt: Date;
    invoices: {
        total: number;
        reconciled: number;
        unreconciled: number;
        totalDifference: number;
        results: InvoiceReconciliationResult[];
    };
    journalEntries: {
        total: number;
        reconciled: number;
        unreconciled: number;
        missingEntries: number;
        amountMismatches: number;
        results: JournalEntryReconciliationResult[];
    };
    summary: {
        hasIssues: boolean;
        totalIssues: number;
        criticalIssues: number;
    };
}
export declare class ReconciliationService {
    /**
     * Réconcilier les factures avec leurs paiements
     */
    reconcileInvoicesPayments(companyId: string, period: ReconciliationPeriod): Promise<InvoiceReconciliationResult[]>;
    /**
     * Réconcilier les transactions avec leurs écritures comptables
     */
    reconcileJournalEntries(companyId: string, period: ReconciliationPeriod): Promise<JournalEntryReconciliationResult[]>;
    /**
     * Générer un rapport de réconciliation complet
     */
    generateReconciliationReport(companyId: string, period: ReconciliationPeriod): Promise<ReconciliationReport>;
}
declare const _default: ReconciliationService;
export default _default;
//# sourceMappingURL=reconciliation.service.d.ts.map