import api from './api';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}

interface SupplierListResponse {
  data: Supplier[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class SupplierService {
  async create(data: Record<string, unknown>): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Record<string, unknown>): Promise<Supplier> {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }

  async list(params?: Record<string, unknown>): Promise<SupplierListResponse> {
    const response = await api.get('/suppliers', { params });
    return response.data;
  }

  async getById(id: string): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data || response.data;
  }
}

export default new SupplierService();
