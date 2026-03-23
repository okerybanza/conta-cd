import api from './api';

export type AgedBalanceType = 'receivables' | 'payables';

export interface AgedBalanceItem {
  id: string;
  number: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  date: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  daysOver90: number;
}

export interface AgedBalanceReport {
  type: AgedBalanceType;
  asOfDate: string;
  items: AgedBalanceItem[];
  totals: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
    total: number;
  };
  summary: {
    totalItems: number;
    totalAmount: number;
    averageDaysOverdue: number;
    itemsOver90Days: number;
    amountOver90Days: number;
  };
}

class AgedBalanceService {
  /**
   * Générer la Balance Âgée
   */
  async generateAgedBalance(
    type: AgedBalanceType,
    asOfDate?: string
  ): Promise<{
    success: boolean;
    data: AgedBalanceReport;
  }> {
    const params = new URLSearchParams();
    params.append('type', type);
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get(`/aged-balance?${params.toString()}`);
    return response.data;
  }
}

export default new AgedBalanceService();

