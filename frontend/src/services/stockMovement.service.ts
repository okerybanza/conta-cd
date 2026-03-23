import api from './api';

export interface StockMovementItem {
  id?: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouseId?: string;
  warehouse?: {
    id: string;
    name: string;
  };
  warehouseToId?: string;
  quantity: number;
  batchId?: string;
  serialNumber?: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  movementNumber: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  status: 'DRAFT' | 'VALIDATED';
  reference?: string;
  referenceId?: string;
  reason?: string;
  items: StockMovementItem[];
  createdAt?: string;
  updatedAt?: string;
  validatedAt?: string;
  validatedBy?: string;
  createdBy?: string;
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  validator?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CreateStockMovementData {
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  items: StockMovementItem[];
  reference?: string;
  referenceId?: string;
  reason?: string;
}

export interface StockMovementFilters {
  movementType?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  status?: 'DRAFT' | 'VALIDATED';
  reference?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface StockMovementListResponse {
  success: boolean;
  data: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class StockMovementService {
  async list(filters: StockMovementFilters = {}): Promise<StockMovementListResponse> {
    const response = await api.get('/stock-movements', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: StockMovement }> {
    const response = await api.get(`/stock-movements/${id}`);
    return response.data;
  }

  async create(data: CreateStockMovementData): Promise<{ success: boolean; data: { id: string } }> {
    const response = await api.post('/stock-movements', data);
    return response.data;
  }

  async validate(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/stock-movements/${id}/validate`);
    return response.data;
  }

  async reverse(id: string, reason: string): Promise<{ success: boolean; data: { reversalId: string } }> {
    const response = await api.post(`/stock-movements/${id}/reverse`, { reason });
    return response.data;
  }

  async calculateStock(productId: string): Promise<{ success: boolean; data: { quantity: number } }> {
    const response = await api.get(`/stock-movements/products/${productId}/stock`);
    return response.data;
  }
}

export default new StockMovementService();
