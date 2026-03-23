import api from './api';

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  isDefault: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateWarehouseData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  isDefault?: boolean;
  notes?: string;
}

export interface UpdateWarehouseData extends Partial<CreateWarehouseData> {
  isActive?: boolean;
}

class WarehouseService {
  async list(includeInactive = false): Promise<{ success: boolean; data: Warehouse[] }> {
    const response = await api.get('/warehouses', {
      params: { includeInactive },
    });
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: Warehouse }> {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  }

  async getDefault(): Promise<{ success: boolean; data: Warehouse | null }> {
    const response = await api.get('/warehouses/default');
    return response.data;
  }

  async create(data: CreateWarehouseData): Promise<{ success: boolean; data: Warehouse }> {
    const response = await api.post('/warehouses', data);
    return response.data;
  }

  async update(id: string, data: UpdateWarehouseData): Promise<{ success: boolean; data: Warehouse }> {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  }
}

export default new WarehouseService();
