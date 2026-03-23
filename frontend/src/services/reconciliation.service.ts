import api from './api';

export interface ReconciliationPeriod {
  startDate: string;
  endDate: string;
}

export interface InvoiceReconciliationResult {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  expectedAmount: number;
  totalPayments: number;
  difference: number;
  isReconciled: boolean;
  lastReconciledAt: string | null;
  issues: string[];
}

export interface JournalEntryReconciliationResult {
  transactionId: string;
  transactionType: 'invoice' | 'payment' | 'expense' | 'payroll';
  transactionDate: string;
  transactionAmount: number;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  isReconciled: boolean;
  issues: string[];
}

export interface ReconciliationReport {
  period: ReconciliationPeriod;
  generatedAt: string;
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

class ReconciliationService {
  /**
   * Réconcilier les factures avec leurs paiements
   */
  async reconcileInvoices(period: ReconciliationPeriod): Promise<{
    success: boolean;
    data: InvoiceReconciliationResult[];
    summary: {
      total: number;
      reconciled: number;
      unreconciled: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('startDate', period.startDate);
    params.append('endDate', period.endDate);

    const response = await api.get(`/reconciliation/invoices?${params.toString()}`);
    return response.data;
  }

  /**
   * Réconcilier les transactions avec leurs écritures comptables
   */
  async reconcileJournalEntries(period: ReconciliationPeriod): Promise<{
    success: boolean;
    data: JournalEntryReconciliationResult[];
    summary: {
      total: number;
      reconciled: number;
      unreconciled: number;
      missingEntries: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('startDate', period.startDate);
    params.append('endDate', period.endDate);

    const response = await api.get(`/reconciliation/journal-entries?${params.toString()}`);
    return response.data;
  }

  /**
   * Générer un rapport de réconciliation complet
   */
  async generateReport(period: ReconciliationPeriod): Promise<{
    success: boolean;
    data: ReconciliationReport;
  }> {
    const params = new URLSearchParams();
    params.append('startDate', period.startDate);
    params.append('endDate', period.endDate);

    const response = await api.get(`/reconciliation/report?${params.toString()}`);
    return response.data;
  }
}

export default new ReconciliationService();

