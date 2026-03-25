import api from './api';

export interface Subscription {
  id: string;
  companyId: string;
  packageId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  autoRenew?: boolean;
  package?: {
    id: string;
    name: string;
    code: string;
    price: number;
    currency: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  dueDate: string;
  paidAt?: string;
  invoiceUrl?: string;
}

export interface UpgradeDowngradeOptions {
  newPackageId: string;
  effectiveDate?: string;
  prorated?: boolean;
}

class SubscriptionService {
  async getCurrent(): Promise<Subscription> {
    const response = await api.get('/subscription/current');
    return response.data.data || response.data;
  }

  async upgrade(options: UpgradeDowngradeOptions): Promise<Subscription> {
    const response = await api.post('/subscription/upgrade', options);
    return response.data.data || response.data;
  }

  async downgrade(options: UpgradeDowngradeOptions): Promise<Subscription> {
    const response = await api.post('/subscription/downgrade', options);
    return response.data.data || response.data;
  }

  async cancel(reason?: string): Promise<Subscription> {
    const response = await api.post('/subscription/cancel', { reason });
    return response.data.data || response.data;
  }

  async reactivate(): Promise<Subscription> {
    const response = await api.post('/subscription/reactivate');
    return response.data.data || response.data;
  }

  async getInvoices(params?: { page?: number; limit?: number }): Promise<{
    data: SubscriptionInvoice[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/subscription/invoices', { params });
    return response.data;
  }

  async getUsage(): Promise<{
    users: { current: number; limit: number };
    storage: { current: number; limit: number };
    invoices: { current: number; limit: number };
    products: { current: number; limit: number };
    customers: { current: number; limit: number };
  }> {
    const response = await api.get('/subscription/usage');
    return response.data.data || response.data;
  }

  async updatePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    const response = await api.post('/subscription/payment-method', { paymentMethodId });
    return response.data;
  }
}

export default new SubscriptionService();
