import api from './api';

export interface FinancialStatementFilters {
  startDate?: string;
  endDate?: string;
  period?: 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
}

export interface IncomeStatementItem {
  accountCode: string;
  accountName: string;
  amount: number;
  category: string;
}

export interface IncomeStatement {
  period: {
    startDate: string;
    endDate: string;
  };
  revenues: {
    sales: IncomeStatementItem[];
    otherRevenues: IncomeStatementItem[];
    total: number;
  };
  expenses: {
    costOfSales: IncomeStatementItem[];
    operatingExpenses: IncomeStatementItem[];
    financialExpenses: IncomeStatementItem[];
    exceptionalExpenses: IncomeStatementItem[];
    total: number;
  };
  results: {
    grossProfit: number;
    operatingResult: number;
    financialResult: number;
    exceptionalResult: number;
    netResult: number;
  };
  comparison?: {
    previousPeriod: {
      startDate: string;
      endDate: string;
      netResult: number;
    };
    variation: number;
    variationPercent: number;
  };
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  amount: number;
  category: string;
}

export interface BalanceSheet {
  period: {
    asOfDate: string;
  };
  assets: {
    fixedAssets: BalanceSheetItem[];
    currentAssets: {
      inventory: BalanceSheetItem[];
      receivables: BalanceSheetItem[];
      cash: BalanceSheetItem[];
    };
    total: number;
  };
  liabilities: {
    equity: BalanceSheetItem[];
    debts: {
      loans: BalanceSheetItem[];
      payables: BalanceSheetItem[];
      otherLiabilities: BalanceSheetItem[];
    };
    total: number;
  };
  equation: {
    assets: number;
    liabilities: number;
    difference: number;
    isBalanced: boolean;
  };
}

export interface CashFlowItem {
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
}

export interface CashFlowStatement {
  period: {
    startDate: string;
    endDate: string;
  };
  operating: {
    items: CashFlowItem[];
    total: number;
  };
  investing: {
    items: CashFlowItem[];
    total: number;
  };
  financing: {
    items: CashFlowItem[];
    total: number;
  };
  netChange: number;
  openingBalance: number;
  closingBalance: number;
}

class FinancialStatementsService {
  /**
   * Obtenir le Compte de Résultat
   */
  async getIncomeStatement(filters?: FinancialStatementFilters): Promise<IncomeStatement> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.compareWithPrevious !== undefined) {
      params.append('compareWithPrevious', filters.compareWithPrevious.toString());
    }

    const response = await api.get(`/financial-statements/income-statement?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtenir le Bilan
   */
  async getBalanceSheet(filters?: FinancialStatementFilters): Promise<BalanceSheet> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/financial-statements/balance-sheet?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtenir le Tableau de Flux de Trésorerie
   */
  async getCashFlowStatement(filters?: FinancialStatementFilters): Promise<CashFlowStatement> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/financial-statements/cash-flow?${params.toString()}`);
    return response.data;
  }

  /**
   * Valider l'équation comptable
   */
  async validateAccountingEquation(asOfDate?: string): Promise<{
    isValid: boolean;
    assets: number;
    liabilities: number;
    equity: number;
    totalLiabilitiesAndEquity: number;
    difference: number;
    message: string;
    details?: {
      assetBreakdown: {
        fixedAssets: number;
        currentAssets: number;
        total: number;
      };
      liabilityBreakdown: {
        equity: number;
        debts: number;
        total: number;
      };
    };
  }> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get(`/financial-statements/validate-equation?${params.toString()}`);
    return response.data;
  }
}

export default new FinancialStatementsService();

