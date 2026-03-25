import api from './api';

export interface CompanySettings {
  id: string;
  companyId: string;
  // Général
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  companyNif?: string;
  companyRccm?: string;
  companyLogoUrl?: string;
  
  // Facturation
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  defaultPaymentTerms?: string;
  invoiceFooter?: string;
  
  // Comptabilité
  fiscalYearStart?: string;
  accountingMethod?: 'cash' | 'accrual';
  enableMultiCurrency?: boolean;
  baseCurrency?: string;
  
  // Notifications
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  
  // Sécurité
  twoFactorEnabled?: boolean;
  sessionTimeout?: number;
  passwordExpiryDays?: number;
  
  // Modules activés
  enabledModules?: string[];
  
  updatedAt?: string;
}

export interface UpdateSettingsData {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  companyNif?: string;
  companyRccm?: string;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  defaultPaymentTerms?: string;
  invoiceFooter?: string;
  fiscalYearStart?: string;
  accountingMethod?: 'cash' | 'accrual';
  enableMultiCurrency?: boolean;
  baseCurrency?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  twoFactorEnabled?: boolean;
  sessionTimeout?: number;
  passwordExpiryDays?: number;
  enabledModules?: string[];
}

class SettingsService {
  async get(): Promise<CompanySettings> {
    const response = await api.get('/settings');
    return response.data.data || response.data;
  }

  async update(data: UpdateSettingsData): Promise<CompanySettings> {
    const response = await api.put('/settings', data);
    return response.data.data || response.data;
  }

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  }

  async testEmailSettings(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/settings/test-email');
    return response.data;
  }

  async testSmsSettings(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/settings/test-sms');
    return response.data;
  }
}

export default new SettingsService();
