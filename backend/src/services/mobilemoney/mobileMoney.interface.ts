export interface MobileMoneyPaymentRequest {
  amount: number;
  currency: 'CDF' | 'USD';
  phoneNumber: string;
  reference: string;
  description: string;
  callbackUrl?: string;
}

export interface MobileMoneyPaymentResponse {
  success: boolean;
  transactionId?: string;
  providerReference?: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  rawResponse?: any;
}

export interface MobileMoneyStatusResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  amount?: number;
  currency?: string;
  message: string;
}

export interface IMobileMoneyProvider {
  name: string;
  initiatePayment(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse>;
  checkStatus(transactionId: string): Promise<MobileMoneyStatusResponse>;
  validateWebhook(payload: any, signature: string): boolean;
}
