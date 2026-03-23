import api from './api';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountCategory = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  category?: AccountCategory;
  parentId?: string;
  isActive: boolean;
  balance: number;
  description?: string;
  parent?: {
    id: string;
    code: string;
    name: string;
    type?: AccountType;
  };
  children?: Account[];
  _count?: {
    expenses: number;
    expenseCategories: number;
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountData {
  code: string;
  name: string;
  type: AccountType;
  category?: AccountCategory;
  parentId?: string;
  description?: string;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {
  isActive?: boolean;
}

export interface AccountFilters {
  limit?: number;
  type?: AccountType;
  category?: AccountCategory;
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
}

// Helper to map snake_case backend response to camelCase frontend interface
const mapAccount = (data: any): Account => {
  if (!data) return data;

  const mapped: Account = {
    id: data.id,
    companyId: data.company_id || data.companyId,
    code: data.code,
    name: data.name,
    type: data.type,
    category: data.category,
    parentId: data.parent_id || data.parentId,
    isActive: data.is_active !== undefined ? data.is_active : data.isActive,
    balance: Number(data.balance || 0),
    description: data.description,
    parent: data.parent ? {
      id: data.parent.id,
      code: data.parent.code,
      name: data.parent.name,
      type: data.parent.type,
    } : undefined,
    _count: data._count ? {
      expenses: data._count.expenses,
      expenseCategories: data._count.expense_categories || data._count.expenseCategories,
      children: data._count.children || data._count.other_accounts,
    } : undefined,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };

  // Recursively map children if present
  // Note: Backend might return 'other_accounts' or 'children' depending on inclusion
  if (data.children || data.other_accounts) {
    mapped.children = (data.children || data.other_accounts).map(mapAccount);
  }

  return mapped;
};

class AccountService {
  async list(filters: AccountFilters = {}): Promise<{ success: boolean; data: Account[] }> {
    const response = await api.get('/accounts', { params: filters });
    return {
      ...response.data,
      data: response.data.data.map(mapAccount),
    };
  }

  async getTree(filters: AccountFilters = {}): Promise<{ success: boolean; data: Account[] }> {
    const response = await api.get('/accounts/tree', { params: filters });
    return {
      ...response.data,
      data: response.data.data.map(mapAccount),
    };
  }

  async getById(id: string): Promise<{ success: boolean; data: Account }> {
    const response = await api.get(`/accounts/${id}`);
    return {
      ...response.data,
      data: mapAccount(response.data.data),
    };
  }

  async getByCode(code: string): Promise<{ success: boolean; data: Account }> {
    const response = await api.get(`/accounts/code/${code}`);
    return {
      ...response.data,
      data: mapAccount(response.data.data),
    };
  }

  async create(data: CreateAccountData): Promise<{ success: boolean; data: Account }> {
    const response = await api.post('/accounts', data);
    return {
      ...response.data,
      data: mapAccount(response.data.data),
    };
  }

  async update(id: string, data: UpdateAccountData): Promise<{ success: boolean; data: Account }> {
    const response = await api.put(`/accounts/${id}`, data);
    return {
      ...response.data,
      data: mapAccount(response.data.data),
    };
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  }

  async getTotalBalance(id: string): Promise<{ success: boolean; data: { balance: number } }> {
    const response = await api.get(`/accounts/${id}/balance`);
    return response.data;
  }

  async findByType(type: AccountType, category?: AccountCategory): Promise<{ success: boolean; data: Account[] }> {
    const params = category ? { category } : {};
    const response = await api.get(`/accounts/by-type/${type}`, { params });
    return {
      ...response.data,
      data: response.data.data.map(mapAccount),
    };
  }
}

export default new AccountService();
