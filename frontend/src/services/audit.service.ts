import api from './api';

export interface AuditLog {
  id: string;
  companyId?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AuditService {
  async getLogs(filters?: AuditLogFilters): Promise<AuditLogListResponse> {
    const response = await api.get('/audit', { params: filters });
    return response.data;
  }

  async getLog(id: string): Promise<AuditLog> {
    const response = await api.get(`/audit/${id}`);
    return response.data.data;
  }

  async verifyIntegrity(): Promise<{ success: boolean; message: string; tamperedLogs?: string[] }> {
    const response = await api.get('/audit/verify');
    return response.data.data;
  }
}

export default new AuditService();

