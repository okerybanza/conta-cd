import api from './api';

export interface Supplier {
  id: string;
  name: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  nif?: string;
  rccm?: string;
  notes?: string;
  accountId?: string;
  logoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierData {
  name: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  nif?: string;
  rccm?: string;
  notes?: string;
  accountId?: string;
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
  async create(data: CreateSupplierData): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Partial<CreateSupplierData>): Promise<Supplier> {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }

  async list(params?: { search?: string; city?: string; country?: string; page?: number; limit?: number }): Promise<SupplierListResponse> {
    const response = await api.get('/suppliers', { params });
    return response.data;
  }

  async getById(id: string): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data || response.data;
  }

  async uploadLogo(id: string, file: File): Promise<Supplier> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/suppliers/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  }
}

export default new SupplierService();
