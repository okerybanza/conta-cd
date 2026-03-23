import api from './api';

export interface Package {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  limits: {
    customers?: number | null;
    products?: number | null;
    users?: number | null;
    emails_per_month?: number | null;
    sms_per_month?: number | null;
    suppliers?: number | null;
    storage_mb?: number | null;
    invoices?: number | null;
    expenses?: number | null;
    recurring_invoices?: number | null;
    companies?: number | null;
  };
  features: {
    expenses?: boolean;
    accounting?: boolean;
    recurring_invoices?: boolean;
    api?: boolean;
    custom_templates?: boolean;
    multi_currency?: boolean;
    advanced_reports?: boolean;
    workflows?: boolean;
    custom_branding?: boolean;
  };
  isActive: boolean;
  displayOrder: number;
}

export interface Subscription {
  id: string;
  companyId: string;
  packageId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  paymentMethod?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  package: Package;
}

export interface QuotaSummary {
  limits: Record<string, number | null>;
  usage: Record<string, number>;
  features: Record<string, boolean>;
}

class PackageService {
  async list(): Promise<{ success: boolean; data: Package[] }> {
    const response = await api.get('/packages');
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: Package }> {
    const response = await api.get(`/packages/${id}`);
    return response.data;
  }

  async getByCode(code: string): Promise<{ success: boolean; data: Package }> {
    const response = await api.get(`/packages/code/${code}`);
    return response.data;
  }
}

class SubscriptionService {
  async getActive(): Promise<{ success: boolean; data: Subscription }> {
    const response = await api.get('/subscription');
    return response.data;
  }

  async create(data: {
    packageId: string;
    billingCycle: 'monthly' | 'yearly';
    startDate?: string;
    trialDays?: number;
  }): Promise<{ success: boolean; data: Subscription }> {
    const response = await api.post('/subscription', data);
    return response.data;
  }

  async upgrade(packageId: string): Promise<{ success: boolean; data: Subscription }> {
    const response = await api.put('/subscription/upgrade', { packageId });
    return response.data;
  }

  async cancel(): Promise<{ success: boolean; data: Subscription }> {
    const response = await api.post('/subscription/cancel');
    return response.data;
  }

  async renew(): Promise<{ success: boolean; data: Subscription }> {
    const response = await api.post('/subscription/renew');
    return response.data;
  }

  async getQuotaSummary(): Promise<{ success: boolean; data: QuotaSummary }> {
    const response = await api.get('/subscription/quota-summary');
    return response.data;
  }
}

export const packageService = new PackageService();
export const subscriptionService = new SubscriptionService();

export default { packageService, subscriptionService };

