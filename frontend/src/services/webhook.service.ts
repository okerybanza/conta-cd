import api from './api';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive?: boolean;
  headers?: Record<string, string>;
  retryAttempts?: number;
  lastTriggeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WebhookEvent = 
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.paid'
  | 'invoice.cancelled'
  | 'payment.received'
  | 'payment.failed'
  | 'expense.created'
  | 'expense.approved'
  | 'customer.created'
  | 'customer.updated'
  | 'product.created'
  | 'product.updated'
  | 'stock.low'
  | 'user.created';

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  response?: any;
  statusCode?: number;
  success: boolean;
  error?: string;
  attemptNumber: number;
  triggeredAt: string;
}

export interface CreateWebhookData {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
}

class WebhookService {
  async list(params?: { page?: number; limit?: number }): Promise<{
    data: Webhook[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/webhook', { params });
    return response.data;
  }

  async getById(id: string): Promise<Webhook> {
    const response = await api.get(`/webhook/${id}`);
    return response.data.data || response.data;
  }

  async create(data: CreateWebhookData): Promise<Webhook> {
    const response = await api.post('/webhook', data);
    return response.data.data || response.data;
  }

  async update(id: string, data: Partial<CreateWebhookData>): Promise<Webhook> {
    const response = await api.put(`/webhook/${id}`, data);
    return response.data.data || response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/webhook/${id}`);
  }

  async toggle(id: string, isActive: boolean): Promise<Webhook> {
    const response = await api.patch(`/webhook/${id}/toggle`, { isActive });
    return response.data.data || response.data;
  }

  async test(id: string): Promise<{
    success: boolean;
    statusCode?: number;
    response?: any;
    error?: string;
  }> {
    const response = await api.post(`/webhook/${id}/test`);
    return response.data.data || response.data;
  }

  async getLogs(webhookId: string, params?: { page?: number; limit?: number }): Promise<{
    data: WebhookLog[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get(`/webhook/${webhookId}/logs`, { params });
    return response.data;
  }

  async retryLog(logId: string): Promise<WebhookLog> {
    const response = await api.post(`/webhook/logs/${logId}/retry`);
    return response.data.data || response.data;
  }

  async getAvailableEvents(): Promise<{
    event: WebhookEvent;
    description: string;
    examplePayload: any;
  }[]> {
    const response = await api.get('/webhook/events');
    return response.data.data || response.data;
  }

  async generateSecret(): Promise<{ secret: string }> {
    const response = await api.post('/webhook/generate-secret');
    return response.data.data || response.data;
  }
}

export default new WebhookService();
