import api from './api';
import { Accountant } from './accountant.service';

export interface GlobalStats {
  companies: {
    total: number;
    active: number;
    inactive: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  users: {
    total: number;
    activeLast30Days: number;
    accountants: number;
  };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
    conversionRate: number;
  };
  revenue: {
    currentMonth: number;
    currentYear: number;
    projection: number;
  };
}

export interface Company {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  createdAt: string;
  subscription?: {
    id: string;
    status: string;
    package: {
      id: string;
      name: string;
      code: string;
    };
  };
  users?: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  _count?: {
    users: number;
    customers: number;
    invoices: number;
  };
}

export interface ContaUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  contaRole: string;
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Package {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  limits: Record<string, any>;
  features: Record<string, boolean>;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateContaUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  contaRole: 'superadmin' | 'admin' | 'support' | 'developer' | 'sales' | 'finance' | 'marketing';
  contaPermissions?: Record<string, any>;
}

export interface CreatePackageData {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  limits?: Record<string, any>;
  features?: Record<string, boolean>;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdatePackageData {
  name?: string;
  description?: string;
  price?: number;
  limits?: Record<string, any>;
  features?: Record<string, boolean>;
  isActive?: boolean;
  displayOrder?: number;
}

class AdminService {
  async getGlobalStats(): Promise<{ success: boolean; data: GlobalStats }> {
    const response = await api.get('/super-admin/stats');
    return response.data;
  }

  async getAllCompanies(filters?: {
    search?: string;
    plan?: string;
    country?: string;
    isActive?: boolean;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Company[]; pagination: any }> {
    const response = await api.get('/super-admin/companies', { params: filters });
    return response.data;
  }

  async getCompanyById(id: string): Promise<{ success: boolean; data: Company }> {
    const response = await api.get(`/super-admin/companies/${id}`);
    return response.data;
  }

  async getContaUsers(): Promise<{ success: boolean; data: ContaUser[] }> {
    const response = await api.get('/super-admin/conta-users');
    return response.data;
  }

  async createContaUser(data: CreateContaUserData): Promise<{ success: boolean; data: ContaUser }> {
    const response = await api.post('/super-admin/conta-users', data);
    return response.data;
  }

  async updateContaUser(userId: string, data: Partial<CreateContaUserData>): Promise<{ success: boolean; data: ContaUser }> {
    const response = await api.put(`/super-admin/conta-users/${userId}`, data);
    return response.data;
  }

  async deleteContaUser(userId: string): Promise<{ success: boolean; data: any; message: string }> {
    const response = await api.delete(`/super-admin/conta-users/${userId}`);
    return response.data;
  }

  async getPackages(): Promise<{ success: boolean; data: Package[] }> {
    // Pour le superadmin, utiliser l'endpoint qui retourne tous les packages (y compris désactivés mais utilisés)
    const response = await api.get('/super-admin/packages');
    // Le backend retourne price, on le garde tel quel
    const packages = response.data.data.map((pkg: any) => ({
      ...pkg,
      price: pkg.price || 0,
    }));
    return { ...response.data, data: packages };
  }

  async getAccountants(filters?: {
    search?: string;
    country?: string;
    city?: string;
    isAvailable?: boolean;
  }): Promise<{ success: boolean; data: Accountant[] }> {
    const response = await api.get('/accountants/search', { params: filters });
    return response.data;
  }

  async createPackage(data: CreatePackageData): Promise<{ success: boolean; data: Package }> {
    const response = await api.post('/packages', data);
    return response.data;
  }

  async updatePackage(id: string, data: UpdatePackageData): Promise<{ success: boolean; data: Package }> {
    const response = await api.put(`/packages/${id}`, data);
    return response.data;
  }

  async deletePackage(id: string, force: boolean = false): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/packages/${id}`, { params: { force } });
    return response.data;
  }

  async getPackageSubscriptionsCount(id: string): Promise<{ success: boolean; data: { count: number } }> {
    const response = await api.get(`/packages/${id}/subscriptions-count`);
    return response.data;
  }

  async getPackageModificationImpact(
    packageId: string,
    limits: Record<string, any>,
    features: Record<string, boolean>
  ): Promise<{
    success: boolean;
    data: {
      totalCompanies: number;
      companiesWithIssues: Array<{
        companyId: string;
        companyName: string;
        issues: Array<{
          metric: string;
          currentUsage: number;
          oldLimit: number | null;
          newLimit: number | null;
        }>;
      }>;
      featuresAdded: string[];
      featuresRemoved: string[];
      limitsIncreased: string[];
      limitsDecreased: string[];
    };
  }> {
    const response = await api.post(`/super-admin/packages/${packageId}/impact`, {
      limits,
      features,
    });
    return response.data;
  }

  async getPackageHistory(packageId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      userId?: string;
      userEmail?: string;
      changes: Record<string, any>;
      packageName?: string;
      totalChanges: number;
      ipAddress?: string;
      userAgent?: string;
      createdAt: string;
    }>;
  }> {
    const response = await api.get(`/super-admin/packages/${packageId}/history`);
    return response.data;
  }

  async getUserPermissions(userId: string): Promise<{
    success: boolean;
    data: {
      companies?: { view: boolean; edit: boolean; suspend: boolean; changePlan: boolean };
      plans?: { view: boolean; edit: boolean; create: boolean; delete: boolean };
      users?: { view: boolean; create: boolean; edit: boolean; delete: boolean; managePermissions: boolean };
      accountants?: { view: boolean; approve: boolean; reject: boolean };
      branding?: { view: boolean; edit: boolean };
      audit?: { view: boolean; export: boolean };
      settings?: { view: boolean; edit: boolean };
    };
  }> {
    const response = await api.get(`/super-admin/conta-users/${userId}/permissions`);
    return response.data;
  }

  async updateUserPermissions(
    userId: string,
    permissions: {
      companies?: { view: boolean; edit: boolean; suspend: boolean; changePlan: boolean };
      plans?: { view: boolean; edit: boolean; create: boolean; delete: boolean };
      users?: { view: boolean; create: boolean; edit: boolean; delete: boolean; managePermissions: boolean };
      accountants?: { view: boolean; approve: boolean; reject: boolean };
      branding?: { view: boolean; edit: boolean };
      audit?: { view: boolean; export: boolean };
      settings?: { view: boolean; edit: boolean };
    }
  ): Promise<{ success: boolean; data: any }> {
    const response = await api.put(`/super-admin/conta-users/${userId}/permissions`, permissions);
    return response.data;
  }

  async resetUserPermissions(userId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/super-admin/conta-users/${userId}/permissions/reset`);
    return response.data;
  }

  async getSubscriptionsWithPayments(filters?: {
    status?: string;
    paymentOverdue?: boolean;
    companyId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/super-admin/subscriptions/payments', { params: filters });
    return response.data;
  }

  async getPaymentStatistics(): Promise<{
    success: boolean;
    data: {
      activeSubscriptions: number;
      overdueSubscriptions: number;
      expiringThisMonth: number;
      monthlyRevenue: number;
      yearlyRevenue: number;
      statusDistribution: Array<{ status: string; count: number }>;
      billingCycleDistribution: Array<{ billingCycle: string; count: number }>;
    };
  }> {
    const response = await api.get('/super-admin/subscriptions/payments/statistics');
    return response.data;
  }

  async recordSubscriptionPayment(
    subscriptionId: string,
    data: {
      amount: number;
      currency?: string;
      paymentMethod: string;
      paymentDate: string;
      transactionReference?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/super-admin/subscriptions/${subscriptionId}/payments`, data);
    return response.data;
  }

  async getSubscriptionPaymentHistory(subscriptionId: string): Promise<{
    success: boolean;
    data: {
      subscription: any;
      history: Array<{
        id: string;
        date: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        status: string;
      }>;
    };
  }> {
    const response = await api.get(`/super-admin/subscriptions/${subscriptionId}/payments/history`);
    return response.data;
  }

  async approveAccountant(accountantId: string): Promise<{ success: boolean; data: any; message: string }> {
    const response = await api.post(`/super-admin/accountants/${accountantId}/approve`);
    return response.data;
  }

  async rejectAccountant(accountantId: string, reason: string): Promise<{ success: boolean; data: any; message: string }> {
    const response = await api.post(`/super-admin/accountants/${accountantId}/reject`, { reason });
    return response.data;
  }

  async getMonthlyRevenueData(): Promise<{ success: boolean; data: Array<{ month: string; revenus: number }> }> {
    const response = await api.get('/super-admin/stats/monthly-revenue');
    return response.data;
  }

  async getCompanyGrowthData(): Promise<{ success: boolean; data: Array<{ month: string; entreprises: number }> }> {
    const response = await api.get('/super-admin/stats/company-growth');
    return response.data;
  }
}

export default new AdminService();

