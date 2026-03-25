import api from './api';

export interface AccountingReportFilters {
  startDate: string;
  endDate: string;
  customerId?: string;
  accountId?: string;
  format?: 'json' | 'pdf' | 'excel';
}

export interface BalanceSheet {
  period: { startDate: string; endDate: string };
  assets: {
    current: { name: string; amount: number }[];
    fixed: { name: string; amount: number }[];
    total: number;
  };
  liabilities: {
    current: { name: string; amount: number }[];
    longTerm: { name: string; amount: number }[];
    total: number;
  };
  equity: {
    items: { name: string; amount: number }[];
    total: number;
  };
  isBalanced: boolean;
}

export interface IncomeStatement {
  period: { startDate: string; endDate: string };
  revenue: {
    items: { name: string; amount: number }[];
    total: number;
  };
  expenses: {
    items: { name: string; amount: number }[];
    total: number;
  };
  netIncome: number;
}

export interface CashFlowStatement {
  period: { startDate: string; endDate: string };
  operating: {
    items: { name: string; amount: number }[];
    total: number;
  };
  investing: {
    items: { name: string; amount: number }[];
    total: number;
  };
  financing: {
    items: { name: string; amount: number }[];
    total: number;
  };
  netCashFlow: number;
}

export interface TrialBalance {
  asOfDate: string;
  accounts: {
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

class AccountingReportsService {
  async getBalanceSheet(filters: AccountingReportFilters): Promise<BalanceSheet> {
    const response = await api.get('/accounting-reports/balance-sheet', { params: filters });
    return response.data.data || response.data;
  }

  async getIncomeStatement(filters: AccountingReportFilters): Promise<IncomeStatement> {
    const response = await api.get('/accounting-reports/income-statement', { params: filters });
    return response.data.data || response.data;
  }

  async getCashFlowStatement(filters: AccountingReportFilters): Promise<CashFlowStatement> {
    const response = await api.get('/accounting-reports/cash-flow', { params: filters });
    return response.data.data || response.data;
  }

  async getTrialBalance(asOfDate: string): Promise<TrialBalance> {
    const response = await api.get('/accounting-reports/trial-balance', { params: { asOfDate } });
    return response.data.data || response.data;
  }

  async downloadBalanceSheet(filters: AccountingReportFilters): Promise<Blob> {
    const response = await api.get('/accounting-reports/balance-sheet/download', {
      params: { ...filters, format: filters.format || 'pdf' },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadIncomeStatement(filters: AccountingReportFilters): Promise<Blob> {
    const response = await api.get('/accounting-reports/income-statement/download', {
      params: { ...filters, format: filters.format || 'pdf' },
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new AccountingReportsService();
