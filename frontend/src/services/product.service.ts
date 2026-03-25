import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  costPrice?: number;
  taxRate?: number;
  unit?: string;
  stockTracking?: boolean;
  minStock?: number;
  maxStock?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: boolean;
}

export interface ProductListResponse {
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  costPrice?: number;
  taxRate?: number;
  unit?: string;
  stockTracking?: boolean;
  minStock?: number;
  maxStock?: number;
}

class ProductService {
  async list(filters?: ProductFilters): Promise<ProductListResponse> {
    const response = await api.get('/products', { params: filters });
    return response.data;
  }

  async getById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data || response.data;
  }

  async create(data: CreateProductData): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
}

export default new ProductService();
