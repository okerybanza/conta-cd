import api from './api';
import { Invoice } from './invoice.service';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentDate: string;
  paymentMethod: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  cardLastFour?: string;
  reference?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice & { totalTtc?: number };
  creator?: { firstName?: string; lastName?: string; email?: string };
}

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentDate: string;
  paymentMethod: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  cardLastFour?: string;
  reference?: string;
  notes?: string;
  status?: string;
}

export type UpdatePaymentData = Partial<CreatePaymentData>;

export interface PaymentFilters {
  page?: number;
  limit?: number;
  paymentMethod?: string;
  search?: string;
}

interface PaymentListResponse {
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class PaymentService {
  async list(filters?: PaymentFilters): Promise<PaymentListResponse> {
    const response = await api.get('/payments', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<Payment> {
    const response = await api.get(`/payments/${id}`);
    return response.data.data || response.data;
  }

  async getByInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await api.get(`/payments/by-invoice/${invoiceId}`);
    return response.data.data || response.data;
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    const response = await api.post('/payments', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: UpdatePaymentData): Promise<Payment> {
    const response = await api.put(`/payments/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  }
}

export default new PaymentService();
