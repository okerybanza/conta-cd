import api from './api';

export interface Notification {
  id: string;
  companyId: string;
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  body: string;
  relatedType?: string;
  relatedId?: string;
  status: 'pending' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface NotificationFilters {
  type?: 'email' | 'sms' | 'whatsapp';
  status?: 'pending' | 'delivered' | 'failed';
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SendInvoiceNotificationData {
  methods: ('email' | 'whatsapp')[];
}

export interface SendPaymentNotificationData {
  methods: ('email' | 'whatsapp')[];
}

export interface SendPaymentReminderData {
  methods: ('email' | 'whatsapp')[];
}

export interface TestEmailData {
  to: string;
  subject?: string;
  message?: string;
}

export interface TestSMSData {
  to: string;
  message?: string;
}

class NotificationService {
  async sendInvoiceNotification(
    invoiceId: string,
    data: SendInvoiceNotificationData
  ): Promise<void> {
    await api.post(`/notifications/invoice/${invoiceId}`, data);
  }

  async sendPaymentNotification(
    paymentId: string,
    data: SendPaymentNotificationData
  ): Promise<void> {
    await api.post(`/notifications/payment/${paymentId}`, data);
  }

  async sendPaymentReminder(
    invoiceId: string,
    data: SendPaymentReminderData
  ): Promise<void> {
    await api.post(`/notifications/reminder/${invoiceId}`, data);
  }

  async list(filters?: NotificationFilters): Promise<NotificationListResponse> {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  }

  async testEmail(data: TestEmailData): Promise<void> {
    await api.post('/notifications/test/email', data);
  }

  async testSMS(data: TestSMSData): Promise<void> {
        await api.post('/notifications/test/sms', data);
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications', { params: { read: false, limit: 1 } });
      return response.data?.pagination?.total ?? response.data?.data?.length ?? 0;
    } catch { return 0; }
  }

  async getRecent(limit = 5): Promise<any[]> {
    try {
      const response = await api.get('/notifications', { params: { limit } });
      return response.data?.data ?? [];
    } catch { return []; }
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }
}

export default new NotificationService();