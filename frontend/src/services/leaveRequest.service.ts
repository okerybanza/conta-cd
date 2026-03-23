import api from './api';

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position?: string;
    department?: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rejector?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateLeaveRequestData {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}

export interface UpdateLeaveRequestData {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
}

export interface LeaveRequestFilters {
  employeeId?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class LeaveRequestService {
  async create(data: CreateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.post('/hr/leave-requests', data);
    return response.data;
  }

  async getById(id: string): Promise<LeaveRequest> {
    const response = await api.get(`/hr/leave-requests/${id}`);
    return response.data;
  }

  async list(filters: LeaveRequestFilters = {}): Promise<{ data: LeaveRequest[]; pagination: any }> {
    const response = await api.get('/hr/leave-requests', { params: filters });
    return response.data;
  }

  async update(id: string, data: UpdateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.put(`/hr/leave-requests/${id}`, data);
    return response.data;
  }

  async approve(id: string): Promise<LeaveRequest> {
    const response = await api.post(`/hr/leave-requests/${id}/approve`);
    return response.data;
  }

  async reject(id: string, rejectionReason?: string): Promise<LeaveRequest> {
    const response = await api.post(`/hr/leave-requests/${id}/reject`, { rejectionReason });
    return response.data;
  }

  async cancel(id: string): Promise<LeaveRequest> {
    const response = await api.post(`/hr/leave-requests/${id}/cancel`);
    return response.data;
  }
}

export default new LeaveRequestService();

