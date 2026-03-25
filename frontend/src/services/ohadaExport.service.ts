import api from './api';

export interface OhadaExportOptions {
  startDate: string;
  endDate: string;
  format: 'xml' | 'csv' | 'excel';
  includeBalanceSheet?: boolean;
  includeIncomeStatement?: boolean;
  includeJournalEntries?: boolean;
  includeTrialBalance?: boolean;
}

export interface OhadaExportResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

class OhadaExportService {
  async initiateExport(options: OhadaExportOptions): Promise<OhadaExportResult> {
    const response = await api.post('/ohada-export/initiate', options);
    return response.data.data || response.data;
  }

  async getExportStatus(exportId: string): Promise<OhadaExportResult> {
    const response = await api.get(`/ohada-export/status/${exportId}`);
    return response.data.data || response.data;
  }

  async downloadExport(exportId: string): Promise<Blob> {
    const response = await api.get(`/ohada-export/download/${exportId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async listExports(params?: { page?: number; limit?: number }): Promise<{
    data: OhadaExportResult[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/ohada-export/list', { params });
    return response.data;
  }

  async validateData(startDate: string, endDate: string): Promise<{
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const response = await api.post('/ohada-export/validate', { startDate, endDate });
    return response.data.data || response.data;
  }
}

export default new OhadaExportService();
