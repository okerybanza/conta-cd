import api from './api';

export interface MobileMoneyProvider {
  id: string;
  name: string;
  code: string;
  logo?: string;
  isActive?: boolean;
}

export interface MobileMoneyPayment {
  id: string;
  invoiceId: string;
  provider: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  reference?: string;
  createdAt: string;
  completedAt?: string;
}

export interface InitiateMobileMoneyPaymentData {
  invoiceId: string;
  provider: string;
  phoneNumber: string;
  amount: number;
  currency: string;
}

interface MobileMoneyPaymentListResponse {
  data: MobileMoneyPayment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class MobileMoneyService {
  async getProviders(): Promise<MobileMoneyProvider[]> {
    const response = await api.get('/mobile-money/providers');
    return response.data.data || response.data;
  }

  async initiatePayment(data: InitiateMobileMoneyPaymentData): Promise<MobileMoneyPayment> {
    const response = await api.post('/mobile-money/initiate', data);
    return response.data.data || response.data;
  }

  async checkPaymentStatus(paymentId: string): Promise<MobileMoneyPayment> {
    const response = await api.get(`/mobile-money/status/${paymentId}`);
    return response.data.data || response.data;
  }

  async listPayments(params?: { invoiceId?: string; status?: string; page?: number; limit?: number }): Promise<MobileMoneyPaymentListResponse> {
    const response = await api.get('/mobile-money/payments', { params });
    return response.data;
  }

  async cancelPayment(paymentId: string): Promise<void> {
    await api.post(`/mobile-money/cancel/${paymentId}`);
  }
}

export default new MobileMoneyService();
