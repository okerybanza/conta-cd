import api from './api';

export interface Customer {
  id: string;
  type: 'particulier' | 'entreprise' | string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  nif?: string;
  rccm?: string;
  logoUrl?: string;
  logo_url?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateCustomerData {
  type: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  nif?: string;
  rccm?: string;
  notes?: string;
  tags?: string[];
}

interface CustomerListResponse {
  data: Customer[];
  pagination?: { page: number; limit: number; total: number; totalPages: number; };
}

class CustomerService {
  async list(params?: Record<string, unknown>): Promise<CustomerListResponse> {
    const response = await api.get('/customers', { params });
    return response.data;
  }
  async getById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data.data || response.data;
  }
  async create(data: CreateCustomerData): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data.data || response.data;
  }
  async update(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data.data || response.data;
  }
  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  }
  async uploadLogo(id: string, file: File): Promise<Customer> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/customers/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  }
}

export default new CustomerService();
