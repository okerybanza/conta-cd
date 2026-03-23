import api from './api';

export interface QuotaMetric {
  customers: number | null;
  products: number | null;
  users: number | null;
  emails_sent: number | null;
  sms_sent: number | null;
  whatsapp_sent: number | null;
  suppliers: number | null;
  expenses: number | null;
  invoices: number | null;
  recurring_invoices: number | null;
}

export interface PackageFeature {
  expenses: boolean;
  accounting: boolean;
  recurring_invoices: boolean;
  api: boolean;
  custom_templates: boolean;
  multi_currency: boolean;
  advanced_reports: boolean;
  workflows: boolean;
  custom_branding: boolean;
  stock: boolean;
  hr: boolean;
}

export interface QuotaSummary {
  limits: QuotaMetric;
  usage: QuotaMetric;
  features: PackageFeature;
  currentPackage?: {
    id: string;
    name: string;
    code: string;
    billingCycle: 'monthly' | 'yearly';
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string | null;
    trialEndsAt: string | null;
  } | null;
}

class QuotaService {
  /**
   * Obtenir le résumé des quotas et fonctionnalités
   */
  async getQuotaSummary(): Promise<QuotaSummary> {
    const response = await api.get('/dashboard/quota-summary');
    return response.data.data;
  }
}

export default new QuotaService();

