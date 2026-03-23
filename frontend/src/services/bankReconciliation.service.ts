import api from './api';

export interface BankTransactionImport {
  date: string;
  valueDate?: string;
  description: string;
  reference?: string;
  amount: number;
  balance?: number;
}

export interface BankStatementImport {
  accountId: string;
  statementNumber: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransactionImport[];
}

export interface BankTransaction {
  id: string;
  statementId: string;
  transactionDate: string;
  valueDate?: string;
  description: string;
  reference?: string;
  amount: number;
  balance?: number;
  type: 'credit' | 'debit';
  category?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  reconciledWith?: string;
  reconciledType?: string;
  notes?: string;
}

export interface BankStatement {
  id: string;
  companyId: string;
  accountId: string;
  statementNumber: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  status: 'draft' | 'imported' | 'reconciled' | 'closed';
  importedAt?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
  account?: {
    id: string;
    code: string;
    name: string;
  };
  transactions?: BankTransaction[];
  _count?: {
    transactions: number;
  };
}

class BankReconciliationService {
  /**
   * Parser un fichier CSV
   */
  async parseCSV(csvContent: string): Promise<{
    success: boolean;
    data: {
      transactions: BankTransactionImport[];
      count: number;
    };
  }> {
    const response = await api.post('/bank-reconciliation/parse-csv', {
      csvContent,
    });
    return response.data;
  }

  /**
   * Importer un relevé bancaire
   */
  async importBankStatement(
    statementData: BankStatementImport
  ): Promise<{
    success: boolean;
    data: BankStatement;
  }> {
    const response = await api.post('/bank-reconciliation/import', statementData);
    return response.data;
  }

  /**
   * Lister les relevés bancaires
   */
  async listBankStatements(accountId?: string): Promise<{
    success: boolean;
    data: BankStatement[];
  }> {
    const params = accountId ? `?accountId=${accountId}` : '';
    const response = await api.get(`/bank-reconciliation/statements${params}`);
    return response.data;
  }

  /**
   * Obtenir un relevé bancaire
   */
  async getBankStatement(statementId: string): Promise<{
    success: boolean;
    data: BankStatement;
  }> {
    const response = await api.get(`/bank-reconciliation/statements/${statementId}`);
    return response.data;
  }

  /**
   * Rapprocher un relevé bancaire
   */
  async reconcileStatement(statementId: string): Promise<{
    success: boolean;
    data: BankStatement;
  }> {
    const response = await api.post(
      `/bank-reconciliation/statements/${statementId}/reconcile`
    );
    return response.data;
  }

  /**
   * Rapprocher manuellement une transaction
   */
  async manualReconcile(
    bankTransactionId: string,
    accountingTransactionId: string,
    accountingTransactionType: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post(
      `/bank-reconciliation/transactions/${bankTransactionId}/reconcile`,
      {
        accountingTransactionId,
        accountingTransactionType,
      }
    );
    return response.data;
  }
}

export default new BankReconciliationService();

