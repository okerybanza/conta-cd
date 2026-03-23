import logger from '../../utils/logger';
import { IMobileMoneyProvider, MobileMoneyPaymentRequest, MobileMoneyPaymentResponse, MobileMoneyStatusResponse } from './mobileMoney.interface';

export class AirtelMoneyProvider implements IMobileMoneyProvider {
  name = 'airtel';
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private sandbox: boolean;

  constructor() {
    this.sandbox = process.env.AIRTEL_SANDBOX === 'true' || !process.env.AIRTEL_CLIENT_ID;
    this.baseUrl = this.sandbox
      ? 'https://openapiuat.airtel.africa'
      : 'https://openapi.airtel.africa';
    this.clientId = process.env.AIRTEL_CLIENT_ID || 'sandbox_client_id';
    this.clientSecret = process.env.AIRTEL_CLIENT_SECRET || 'sandbox_secret';
  }

  private async getToken(): Promise<string> {
    if (this.sandbox) return 'sandbox_token';
    try {
      const res = await fetch(`${this.baseUrl}/auth/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: this.clientId, client_secret: this.clientSecret, grant_type: 'client_credentials' }),
      });
      const data = await res.json() as any;
      return data.access_token;
    } catch (e: any) {
      logger.error('Airtel getToken failed', { error: e.message });
      throw e;
    }
  }

  async initiatePayment(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    if (this.sandbox) {
      logger.info('Airtel Money SANDBOX - simulating payment', { reference: req.reference });
      return {
        success: true,
        transactionId: `AIR-SANDBOX-${Date.now()}`,
        providerReference: req.reference,
        status: 'pending',
        message: 'Payment request sent to customer phone (SANDBOX)',
      };
    }

    try {
      const token = await this.getToken();
      const res = await fetch(`${this.baseUrl}/merchant/v1/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Country': 'CD',
          'X-Currency': req.currency,
        },
        body: JSON.stringify({
          reference: req.reference,
          subscriber: { country: 'CD', currency: req.currency, msisdn: req.phoneNumber },
          transaction: { amount: req.amount, country: 'CD', currency: req.currency, id: req.reference },
        }),
      });
      const data = await res.json() as any;
      return {
        success: data.status?.code === '200',
        transactionId: data.data?.transaction?.id,
        providerReference: data.data?.transaction?.airtel_money_id,
        status: 'pending',
        message: data.status?.message || 'Payment initiated',
        rawResponse: data,
      };
    } catch (e: any) {
      logger.error('Airtel initiatePayment failed', { error: e.message });
      return { success: false, status: 'failed', message: e.message };
    }
  }

  async checkStatus(transactionId: string): Promise<MobileMoneyStatusResponse> {
    if (this.sandbox) {
      return { transactionId, status: 'success', message: 'SANDBOX - payment successful' };
    }
    try {
      const token = await this.getToken();
      const res = await fetch(`${this.baseUrl}/standard/v1/payments/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Country': 'CD', 'X-Currency': 'CDF' },
      });
      const data = await res.json() as any;
      const status = data.data?.transaction?.status === 'TS' ? 'success' : data.data?.transaction?.status === 'TF' ? 'failed' : 'pending';
      return { transactionId, status, message: data.status?.message || '' };
    } catch (e: any) {
      return { transactionId, status: 'failed', message: e.message };
    }
  }

  validateWebhook(payload: any, signature: string): boolean {
    return !!payload && !!signature;
  }
}

export default new AirtelMoneyProvider();
