import api from './api';

export interface RecurringInvoice {
  id: string;
  companyId: string;
  customerId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  dueDateDays?: number;
  currency?: string;
  reference?: string;
  poNumber?: string;
  notes?: string;
  paymentTerms?: string;
  lines: Array<{
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  transportFees?: number;
  platformFees?: number;
  autoSend?: boolean;
  sendToCustomer?: boolean;
  isActive?: boolean;
  totalGenerated?: number;
  lastInvoiceId?: string;
  customer?: {
    id: string;
    type: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringInvoiceData {
  customerId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval?: number;
  startDate: string;
  endDate?: string;
  dueDateDays?: number;
  currency?: string;
  reference?: string;
  poNumber?: string;
  notes?: string;
  paymentTerms?: string;
  lines: Array<{
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
  transportFees?: number;
  platformFees?: number;
  autoSend?: boolean;
  sendToCustomer?: boolean;
}

export interface UpdateRecurringInvoiceData extends Partial<CreateRecurringInvoiceData> {
  isActive?: boolean;
}

const recurringInvoiceService = {
  async list(filters?: { isActive?: boolean; customerId?: string; page?: number; limit?: number }): Promise<{ data: RecurringInvoice[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.customerId) {
      params.append('customerId', filters.customerId);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    const response = await api.get(`/recurring-invoices?${params.toString()}`);
    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  },

  async getById(id: string): Promise<RecurringInvoice> {
    const response = await api.get(`/recurring-invoices/${id}`);
    return response.data.data;
  },

  async create(data: CreateRecurringInvoiceData): Promise<RecurringInvoice> {
    const response = await api.post('/recurring-invoices', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateRecurringInvoiceData): Promise<RecurringInvoice> {
    const response = await api.put(`/recurring-invoices/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/recurring-invoices/${id}`);
  },

  async generate(id: string): Promise<{ invoiceId: string }> {
    const response = await api.post(`/recurring-invoices/${id}/generate`);
    return response.data.data;
  },

  async getHistory(id: string): Promise<any[]> {
    const response = await api.get(`/recurring-invoices/${id}/history`);
    return response.data.data;
  },
};

export default recurringInvoiceService;

