import api from './api';

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: string;
  quotationDate: string;
  expiryDate?: string;
  totalAmount: number;
  currency?: string;
  customer?: {
    id: string;
    type: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    email?: string;
  };
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface QuotationListResponse {
  data: Quotation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateQuotationData {
  customerId: string;
  quotationDate: string;
  expiryDate?: string;
  status?: string;
  notes?: string;
}

class QuotationService {
  async list(filters?: QuotationFilters): Promise<QuotationListResponse> {
    const response = await api.get('/quotations', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<Quotation> {
    const response = await api.get(`/quotations/${id}`);
    return response.data.data || response.data;
  }

  async create(data: CreateQuotationData): Promise<Quotation> {
    const response = await api.post('/quotations', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Partial<CreateQuotationData>): Promise<Quotation> {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/quotations/${id}`);
  }
}

export default new QuotationService();
