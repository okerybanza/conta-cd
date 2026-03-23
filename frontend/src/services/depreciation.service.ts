import api from './api';

export interface CreateDepreciationData {
  assetAccountId: string;
  depreciationAccountId: string;
  assetName: string;
  acquisitionDate: string;
  acquisitionCost: number;
  depreciationMethod: 'linear' | 'declining';
  depreciationRate?: number;
  usefulLife: number;
  notes?: string;
}

export interface UpdateDepreciationData {
  assetName?: string;
  depreciationMethod?: 'linear' | 'declining';
  depreciationRate?: number;
  usefulLife?: number;
  isActive?: boolean;
  notes?: string;
}

export interface Depreciation {
  id: string;
  companyId: string;
  assetAccountId: string;
  depreciationAccountId: string;
  assetName: string;
  acquisitionDate: string;
  acquisitionCost: number;
  depreciationMethod: 'linear' | 'declining';
  depreciationRate?: number;
  usefulLife: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  isActive: boolean;
  notes?: string;
  assetAccount: any;
  depreciationAccount: any;
  createdAt: string;
  updatedAt: string;
}

export interface DepreciationTableEntry {
  period: string;
  date: string;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

class DepreciationService {
  /**
   * Créer un plan d'amortissement
   */
  async create(data: CreateDepreciationData): Promise<{ success: boolean; data: Depreciation }> {
    const response = await api.post('/depreciations', data);
    return response.data;
  }

  /**
   * Obtenir un plan d'amortissement par ID
   */
  async getById(id: string): Promise<{ success: boolean; data: Depreciation }> {
    const response = await api.get(`/depreciations/${id}`);
    return response.data;
  }

  /**
   * Lister les plans d'amortissement
   */
  async list(filters?: { isActive?: boolean }): Promise<{ success: boolean; data: Depreciation[] }> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }

    const response = await api.get(`/depreciations?${params.toString()}`);
    return response.data;
  }

  /**
   * Mettre à jour un plan d'amortissement
   */
  async update(id: string, data: UpdateDepreciationData): Promise<{ success: boolean; data: Depreciation }> {
    const response = await api.put(`/depreciations/${id}`, data);
    return response.data;
  }

  /**
   * Supprimer un plan d'amortissement
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/depreciations/${id}`);
    return response.data;
  }

  /**
   * Calculer l'amortissement mensuel
   */
  async calculateMonthly(id: string): Promise<{ success: boolean; data: { monthlyDepreciation: number } }> {
    const response = await api.get(`/depreciations/${id}/monthly`);
    return response.data;
  }

  /**
   * Générer une écriture d'amortissement
   */
  async generateEntry(id: string, period: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/depreciations/${id}/generate-entry`, { period });
    return response.data;
  }

  /**
   * Générer le tableau d'amortissement
   */
  async generateTable(id: string): Promise<{ success: boolean; data: DepreciationTableEntry[] }> {
    const response = await api.get(`/depreciations/${id}/table`);
    return response.data;
  }
}

export default new DepreciationService();

