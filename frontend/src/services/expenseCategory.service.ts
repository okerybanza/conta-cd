import api from './api';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  accountId?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseCategoryData {
  name: string;
  description?: string;
  accountId?: string;
  color?: string;
  icon?: string;
}

interface ExpenseCategoryListResponse {
  data: ExpenseCategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ExpenseCategoryService {
  async list(params?: { search?: string; page?: number; limit?: number }): Promise<ExpenseCategoryListResponse> {
    const response = await api.get('/expense-categories', { params });
    return response.data;
  }

  async getById(id: string): Promise<ExpenseCategory> {
    const response = await api.get(`/expense-categories/${id}`);
    return response.data.data || response.data;
  }

  async create(data: CreateExpenseCategoryData): Promise<ExpenseCategory> {
    const response = await api.post('/expense-categories', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Partial<CreateExpenseCategoryData>): Promise<ExpenseCategory> {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/expense-categories/${id}`);
  }
}

export default new ExpenseCategoryService();
