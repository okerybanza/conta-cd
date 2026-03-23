import api from './api';

export interface Contract {
  id: string;
  companyId: string;
  accountantId: string;
  type: string;
  title: string;
  content?: string;
  templateId?: string;
  fileUrl?: string;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';
  companySignedAt?: string;
  companySignedBy?: string;
  accountantSignedAt?: string;
  accountantSignedBy?: string;
  startDate?: string;
  endDate?: string;
  signedAt?: string;
  company?: {
    id: string;
    name: string;
    businessName?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  accountant?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    accountantProfile?: any;
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface CreateContractData {
  companyId: string;
  accountantId: string;
  type?: string;
  title: string;
  content?: string;
  templateId?: string;
  fileUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateContractData {
  title?: string;
  content?: string;
  templateId?: string;
  fileUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SignContractData {
  signature: string;
}

class ContractService {
  async getTemplates(): Promise<{ success: boolean; data: ContractTemplate[] }> {
    const response = await api.get('/contracts/templates');
    return response.data;
  }

  async create(data: CreateContractData): Promise<{ success: boolean; data: Contract }> {
    const response = await api.post('/contracts', data);
    return response.data;
  }

  async getById(contractId: string): Promise<{ success: boolean; data: Contract }> {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  }

  async list(filters?: {
    companyId?: string;
    accountantId?: string;
    status?: string;
    type?: string;
  }): Promise<{ success: boolean; data: Contract[] }> {
    const response = await api.get('/contracts', { params: filters });
    return response.data;
  }

  async update(
    contractId: string,
    data: UpdateContractData
  ): Promise<{ success: boolean; data: Contract }> {
    const response = await api.put(`/contracts/${contractId}`, data);
    return response.data;
  }

  async signByCompany(
    contractId: string,
    data: SignContractData
  ): Promise<{ success: boolean; data: Contract }> {
    const response = await api.post(`/contracts/${contractId}/sign/company`, data);
    return response.data;
  }

  async signByAccountant(
    contractId: string,
    data: SignContractData
  ): Promise<{ success: boolean; data: Contract }> {
    const response = await api.post(`/contracts/${contractId}/sign/accountant`, data);
    return response.data;
  }

  async cancel(contractId: string): Promise<{ success: boolean; data: Contract }> {
    const response = await api.delete(`/contracts/${contractId}`);
    return response.data;
  }
}

export default new ContractService();

