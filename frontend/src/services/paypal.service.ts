import api from './api';

export interface PayPalOrderResponse {
  orderId: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  invoiceId?: string;
  subscriptionId?: string;
  packageId?: string;
  amount: number;
  currency: string;
  type: 'invoice' | 'subscription';
}

export interface PayPalCaptureResponse {
  success: boolean;
  message: string;
  paymentId?: string;
  subscriptionId?: string;
  orderId: string;
  captureId?: string;
  amount: number;
  currency: string;
}

class PayPalService {
  /**
   * Créer une Order PayPal pour une facture ou un abonnement
   */
  async createOrder(data: {
    invoiceId?: string;
    subscriptionId?: string;
    packageId?: string;
    amount: number;
    currency?: string;
    description?: string;
    type: 'invoice' | 'subscription';
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ success: boolean; data: PayPalOrderResponse }> {
    const response = await api.post('/payments/paypal/init', data);
    return response.data;
  }

  /**
   * Capturer une Order PayPal après approbation
   */
  async captureOrder(data: {
    orderId: string;
    invoiceId?: string;
    subscriptionId?: string;
    packageId?: string;
    type: 'invoice' | 'subscription';
  }): Promise<{ success: boolean; data: PayPalCaptureResponse }> {
    const response = await api.post('/payments/paypal/capture', data);
    return response.data;
  }

  /**
   * Récupérer les détails d'une Order PayPal
   */
  async getOrderDetails(orderId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/payments/paypal/order/${orderId}`);
    return response.data;
  }

  /**
   * Obtenir l'URL d'approbation depuis les liens de l'order
   */
  getApprovalUrl(order: PayPalOrderResponse): string | null {
    const approvalLink = order.links?.find((link) => link.rel === 'approve');
    return approvalLink?.href || null;
  }
}

export const paypalService = new PayPalService();

