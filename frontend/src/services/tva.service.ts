import api from './api';

export interface VATReportFilters {
  startDate?: string;
  endDate?: string;
  period?: 'month' | 'quarter' | 'year';
}

export interface VATReportItem {
  date: string;
  documentNumber: string;
  documentType: 'invoice' | 'expense';
  customerName?: string;
  supplierName?: string;
  amountHt: number;
  taxRate: number;
  vatAmount: number;
  currency: string;
}

export interface VATReport {
  period: {
    startDate: string;
    endDate: string;
  };
  collected: {
    items: VATReportItem[];
    total: number;
    byRate: Array<{
      rate: number;
      amount: number;
      count: number;
    }>;
  };
  deductible: {
    items: VATReportItem[];
    total: number;
    byRate: Array<{
      rate: number;
      amount: number;
      count: number;
    }>;
  };
  summary: {
    totalCollected: number;
    totalDeductible: number;
    vatToPay: number;
    netVAT: number;
  };
}

export interface VATDeclaration {
  period: string;
  vatCollected: number;
  vatDeductible: number;
  vatToPay: number;
  status: 'draft' | 'submitted' | 'paid';
  submittedAt?: string;
  paidAt?: string;
}

class TVAService {
  /**
   * Obtenir le rapport TVA détaillé
   */
  async getVATReport(filters?: VATReportFilters): Promise<{ success: boolean; data: VATReport }> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/tva/report?${params.toString()}`);
    return response.data;
  }

  /**
   * Calculer la TVA collectée
   */
  async getVATCollected(filters?: VATReportFilters): Promise<{ success: boolean; data: { amount: number } }> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/tva/collected?${params.toString()}`);
    return response.data;
  }

  /**
   * Calculer la TVA déductible
   */
  async getVATDeductible(filters?: VATReportFilters): Promise<{ success: boolean; data: { amount: number } }> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/tva/deductible?${params.toString()}`);
    return response.data;
  }

  /**
   * Calculer la TVA à payer
   */
  async getVATToPay(filters?: VATReportFilters): Promise<{ success: boolean; data: { amount: number } }> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await api.get(`/tva/to-pay?${params.toString()}`);
    return response.data;
  }

  /**
   * Générer une déclaration TVA
   */
  async generateVATDeclaration(period: string): Promise<{ success: boolean; data: VATDeclaration }> {
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await api.get(`/tva/declaration?${params.toString()}`);
    return response.data;
  }
}

export default new TVAService();

