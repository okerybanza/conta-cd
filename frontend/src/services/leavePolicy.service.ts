import api from './api';

export interface LeavePolicy {
  id: string;
  companyId: string;
  name: string;
  leaveType: string;
  daysPerYear: number;
  daysPerMonth?: number;
  maxAccumulation?: number;
  carryForward: boolean;
  requiresApproval: boolean;
  minNoticeDays: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeavePolicyData {
  name: string;
  leaveType: string;
  daysPerYear: number;
  daysPerMonth?: number;
  maxAccumulation?: number;
  carryForward?: boolean;
  requiresApproval?: boolean;
  minNoticeDays?: number;
  description?: string;
}

export interface UpdateLeavePolicyData {
  name?: string;
  daysPerYear?: number;
  daysPerMonth?: number;
  maxAccumulation?: number;
  carryForward?: boolean;
  requiresApproval?: boolean;
  minNoticeDays?: number;
  isActive?: boolean;
  description?: string;
}

export interface LeavePolicyFilters {
  leaveType?: string;
  isActive?: boolean;
}

class LeavePolicyService {
  async create(data: CreateLeavePolicyData): Promise<LeavePolicy> {
    const response = await api.post('/hr/leave-policies', data);
    return response.data;
  }

  async getById(id: string): Promise<LeavePolicy> {
    const response = await api.get(`/hr/leave-policies/${id}`);
    return response.data;
  }

  async getByType(type: string): Promise<LeavePolicy | null> {
    try {
      const response = await api.get(`/hr/leave-policies/type/${type}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async list(filters: LeavePolicyFilters = {}): Promise<{ data: LeavePolicy[]; total: number }> {
    const response = await api.get('/hr/leave-policies', { params: filters });
    return response.data;
  }

  async update(id: string, data: UpdateLeavePolicyData): Promise<LeavePolicy> {
    const response = await api.put(`/hr/leave-policies/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/hr/leave-policies/${id}`);
  }

  async createDefaults(): Promise<LeavePolicy[]> {
    const response = await api.post('/hr/leave-policies/defaults');
    return response.data;
  }
}

export default new LeavePolicyService();

