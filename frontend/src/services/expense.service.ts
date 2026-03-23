import api from './api';

export interface Expense {
  id: string;
  companyId: string;
  expenseNumber: string;
  expenseDate: string;
  supplierId?: string;
  supplierName?: string;
  categoryId?: string;
  accountId?: string;
  amountHt: number;
  taxRate?: number;
  taxAmount?: number;
  amountTtc: number;
  paymentMethod: string;
  paymentDate?: string;
  status: string;
  reference?: string;
  description?: string;
  notes?: string;
  currency?: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  cardLastFour?: string;
  supplier?: {
    id: string;
    name: string;
    businessName?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  account?: {
    id: string;
    code: string;
    name: string;
  };
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  expenseDate: string;
  supplierId?: string;
  supplierName?: string;
  categoryId?: string;
  accountId?: string;
  amountHt: number;
  taxRate?: number;
  amountTtc: number;
  paymentMethod: string;
  paymentDate?: string;
  status?: string;
  reference?: string;
  description?: string;
  notes?: string;
  currency?: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  cardLastFour?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseListResponse {
  success: boolean;
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ExpenseService {
  async list(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    const response = await api.get('/expenses', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: Expense }> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  }

  async create(data: CreateExpenseData): Promise<{ success: boolean; data: Expense }> {
    const response = await api.post('/expenses', data);
    return response.data;
  }

  async update(id: string, data: UpdateExpenseData): Promise<{ success: boolean; data: Expense }> {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  }

  async duplicate(id: string): Promise<{ success: boolean; data: Expense }> {
    const response = await api.post(`/expenses/${id}/duplicate`);
    return response.data;
  }

  // Justificatifs (Attachments)
  async listAttachments(expenseId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/expenses/${expenseId}/attachments`);
    return response.data;
  }

  async uploadAttachment(expenseId: string, file: File): Promise<{ success: boolean; data: any }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/expenses/${expenseId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAttachment(expenseId: string, attachmentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/expenses/${expenseId}/attachments/${attachmentId}`);
    return response.data;
  }

  getAttachmentUrl(expenseId: string, filename: string): string {
    return `/api/v1/expenses/${expenseId}/attachments/${filename}`;
  }

  // Approbations (Approvals)
  async requestApproval(expenseId: string, comments?: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/expenses/${expenseId}/approval/request`, { comments });
    return response.data;
  }

  async getApprovalsByExpense(expenseId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/expenses/${expenseId}/approvals`);
    return response.data;
  }

  async approveExpense(approvalId: string, comments?: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/expenses/approvals/${approvalId}/approve`, { comments });
    return response.data;
  }

  async rejectExpense(approvalId: string, reason: string, comments?: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/expenses/approvals/${approvalId}/reject`, { reason, comments });
    return response.data;
  }

  async listPendingApprovals(): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get('/expenses/approvals/pending');
    return response.data;
  }

  async getApprovalById(approvalId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/expenses/approvals/${approvalId}`);
    return response.data;
  }

  // Règles d'approbation (Approval Rules)
  async listApprovalRules(): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get('/expenses/approval-rules');
    return response.data;
  }

  async getApprovalRuleById(ruleId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/expenses/approval-rules/${ruleId}`);
    return response.data;
  }

  async createApprovalRule(data: {
    name: string;
    description?: string;
    enabled?: boolean;
    amountThreshold?: number | null;
    categoryId?: string | null;
    requireJustificatif?: boolean;
    approvers: string[];
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/expenses/approval-rules', data);
    return response.data;
  }

  async updateApprovalRule(ruleId: string, data: Partial<{
    name: string;
    description?: string;
    enabled?: boolean;
    amountThreshold?: number | null;
    categoryId?: string | null;
    requireJustificatif?: boolean;
    approvers: string[];
  }>): Promise<{ success: boolean; data: any }> {
    const response = await api.put(`/expenses/approval-rules/${ruleId}`, data);
    return response.data;
  }

  async deleteApprovalRule(ruleId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/expenses/approval-rules/${ruleId}`);
    return response.data;
  }
}

export default new ExpenseService();

