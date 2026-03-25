import api from './api';

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  documentType: 'invoice' | 'expense' | 'payment' | 'journal_entry';
  steps: ApprovalStep[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  approverRole?: string;
  approverUserId?: string;
  requiredApprovals?: number;
  autoApproveAmount?: number;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  documentType: string;
  documentId: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  approvals: Approval[];
}

export interface Approval {
  id: string;
  stepId: string;
  approverUserId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  documentType: 'invoice' | 'expense' | 'payment' | 'journal_entry';
  steps: Omit<ApprovalStep, 'id'>[];
}

class ApprovalWorkflowService {
  async listWorkflows(params?: { documentType?: string; page?: number; limit?: number }): Promise<{
    data: ApprovalWorkflow[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/approval-workflow/workflows', { params });
    return response.data;
  }

  async getWorkflow(id: string): Promise<ApprovalWorkflow> {
    const response = await api.get(`/approval-workflow/workflows/${id}`);
    return response.data.data || response.data;
  }

  async createWorkflow(data: CreateWorkflowData): Promise<ApprovalWorkflow> {
    const response = await api.post('/approval-workflow/workflows', data);
    return response.data.data || response.data;
  }

  async updateWorkflow(id: string, data: Partial<CreateWorkflowData>): Promise<ApprovalWorkflow> {
    const response = await api.put(`/approval-workflow/workflows/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/approval-workflow/workflows/${id}`);
  }

  async listPendingApprovals(params?: { page?: number; limit?: number }): Promise<{
    data: ApprovalRequest[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/approval-workflow/pending', { params });
    return response.data;
  }

  async approveRequest(requestId: string, comments?: string): Promise<ApprovalRequest> {
    const response = await api.post(`/approval-workflow/approve/${requestId}`, { comments });
    return response.data.data || response.data;
  }

  async rejectRequest(requestId: string, comments: string): Promise<ApprovalRequest> {
    const response = await api.post(`/approval-workflow/reject/${requestId}`, { comments });
    return response.data.data || response.data;
  }

  async getRequestStatus(requestId: string): Promise<ApprovalRequest> {
    const response = await api.get(`/approval-workflow/requests/${requestId}`);
    return response.data.data || response.data;
  }
}

export default new ApprovalWorkflowService();
