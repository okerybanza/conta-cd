import api from './api';

export interface Accountant {
  id: string;
  userId: string;
  companyName: string;
  registrationNumber?: string;
  specialization?: string[];
  experienceYears?: number;
  country: string;
  province?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  professionalPhone?: string;
  professionalEmail?: string;
  website?: string;
  isAvailable: boolean;
  rating?: number;
  totalCompanies?: number;
  activeCompaniesCount?: number;
  maxCompanies?: number;
  totalReviews?: number;
  totalCompaniesManaged?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AccountantProfile extends Accountant {
  bio?: string;
  certifications?: string[];
  languages?: string[];
}

export interface CreateAccountantProfileData {
  companyName: string;
  registrationNumber?: string;
  specialization?: string[];
  experienceYears?: number;
  country: string;
  province?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  professionalPhone?: string;
  professionalEmail?: string;
  website?: string;
  bio?: string;
  certifications?: string[];
  languages?: string[];
  isAvailable?: boolean;
  maxCompanies?: number;
}

export interface SearchAccountantFilters {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  province?: string;
  city?: string;
  isAvailable?: boolean;
}

export interface CompanyAccountant {
  id: string;
  companyId: string;
  accountantId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  rejectionReason?: string;
  accountant?: Accountant;
  company?: {
    id: string;
    name: string;
  };
}

const accountantService = {
  async search(filters: SearchAccountantFilters = {}): Promise<{ accountants: Accountant[]; total: number; page: number; limit: number; totalPages: number }> {
    const response = await api.get('/accountants/search', { params: filters });
    return response.data;
  },

  async createProfile(data: CreateAccountantProfileData): Promise<AccountantProfile> {
    const response = await api.post('/accountants/profile', data);
    return response.data;
  },

  async updateProfile(data: Partial<CreateAccountantProfileData>): Promise<AccountantProfile> {
    const response = await api.patch('/accountants/profile', data);
    return response.data;
  },

  async getCompanies(): Promise<any[]> {
    const response = await api.get('/accountants/companies');
    return response.data;
  },

  async getManagedCompanies(): Promise<any[]> {
    const response = await api.get('/accountants/companies');
    return response.data;
  },

  /**
   * Récupérer le cabinet de l'expert connecté (si existant).
   * Le backend peut retourner l'objet directement ou le wrapper via `.data`,
   * donc le type est volontairement souple côté frontend.
   */
  async getOwnCabinet(): Promise<any> {
    const response = await api.get('/accountants/cabinet');
    return response.data;
  },

  async getDashboardStats(): Promise<any> {
    const response = await api.get('/accountants/dashboard-stats');
    return response.data;
  },

  async getRequests(): Promise<CompanyAccountant[]> {
    const response = await api.get('/accountants/requests');
    return response.data;
  },

  async getInvitations(status?: string): Promise<CompanyAccountant[]> {
    const params = status ? { status } : {};
    const response = await api.get('/accountants/requests', { params });
    return response.data;
  },

  async acceptRequest(requestId: string): Promise<void> {
    await api.post(`/accountants/requests/${requestId}/accept`);
  },

  async acceptInvitation(invitationId: string, data?: any): Promise<void> {
    await api.post(`/accountants/requests/${invitationId}/accept`, data);
  },

  async rejectRequest(requestId: string, reason?: string): Promise<void> {
    await api.post(`/accountants/requests/${requestId}/reject`, { reason });
  },

  async invite(accountantId: string | { accountantId: string }): Promise<void> {
    const id = typeof accountantId === 'string' ? accountantId : accountantId.accountantId;
    await api.post(`/accountants/${id}/invite`);
  },

  async getProfile(userId?: string): Promise<AccountantProfile> {
    const url = userId ? `/accountants/profile?userId=${userId}` : '/accountants/profile';
    const response = await api.get(url);
    return response.data;
  },

  async getPublicProfile(accountantId: string): Promise<{ success: boolean; data: Accountant }> {
    const response = await api.get(`/accountants/${accountantId}`);
    return response.data;
  },

  async createCabinet(data: any): Promise<AccountantProfile> {
    const response = await api.post('/accountants/cabinet', data);
    return response.data;
  },

  async getById(id: string): Promise<Accountant> {
    const response = await api.get(`/accountants/${id}`);
    return response.data?.data ?? response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/accountants/${id}`);
  },
};

export default accountantService;

