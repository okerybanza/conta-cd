import api from './api';

export interface VisapayInitPaymentResponse {
  paymentUrl: string;
  transactionId: string;
  reference: string;
  invoiceId?: string;
  subscriptionId?: string;
  packageId?: string;
  amount: number;
  currency: string;
  type: 'invoice' | 'subscription';
}

export interface VisapayPaymentStatusResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  reference?: string;
}

class VisapayService {
  /**
   * Initialiser un paiement Visapay pour une facture ou un abonnement
   */
  async initPayment(data: {
    invoiceId?: string;
    subscriptionId?: string;
    packageId?: string;
    amount: number;
    currency?: string;
    description?: string;
    type: 'invoice' | 'subscription';
    returnUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    customerName?: string;
    cardData?: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      cardholderName: string;
    };
  }): Promise<{ success: boolean; data: VisapayInitPaymentResponse }> {
    const response = await api.post('/payments/visapay/init', data);
    return response.data;
  }

  /**
   * Vérifier le statut d'un paiement Visapay
   */
  async checkPaymentStatus(transactionId: string): Promise<{ success: boolean; data: VisapayPaymentStatusResponse }> {
    const response = await api.get(`/payments/visapay/status/${transactionId}`);
    return response.data;
  }
}

export const visapayService = new VisapayService();

