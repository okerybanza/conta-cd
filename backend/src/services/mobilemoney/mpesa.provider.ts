import logger from '../../utils/logger';
import { IMobileMoneyProvider, MobileMoneyPaymentRequest, MobileMoneyPaymentResponse, MobileMoneyStatusResponse } from './mobileMoney.interface';

export class MPesaProvider implements IMobileMoneyProvider {
  name = 'mpesa';
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private sandbox: boolean;

  constructor() {
    this.sandbox = process.env.MPESA_SANDBOX === 'true' || !process.env.MPESA_CONSUMER_KEY;
    this.baseUrl = this.sandbox
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || 'sandbox_key';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'sandbox_secret';
  }

  async initiatePayment(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    if (this.sandbox) {
      logger.info('M-Pesa SANDBOX - simulating payment', { reference: req.reference });
      return {
        success: true,
        transactionId: `MPE-SANDBOX-${Date.now()}`,
        providerReference: req.reference,
        status: 'pending',
        message: 'STK Push sent to customer phone (SANDBOX)',
      };
    }
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const tokenRes = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      const tokenData = await tokenRes.json() as any;
      const token = tokenData.access_token;

      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
      const shortcode = process.env.MPESA_SHORTCODE || '';
      const passkey = process.env.MPESA_PASSKEY || '';
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

      const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: req.amount,
          PartyA: req.phoneNumber,
          PartyB: shortcode,
          PhoneNumber: req.phoneNumber,
          CallBackURL: req.callbackUrl,
          AccountReference: req.reference,
          TransactionDesc: req.description,
        }),
      });
      const data = await res.json() as any;
      return {
        success: data.ResponseCode === '0',
        transactionId: data.CheckoutRequestID,
        status: 'pending',
        message: data.CustomerMessage || data.ResponseDescription,
        rawResponse: data,
      };
    } catch (e: any) {
      logger.error('MPesa initiatePayment failed', { error: e.message });
      return { success: false, status: 'failed', message: e.message };
    }
  }

  async checkStatus(transactionId: string): Promise<MobileMoneyStatusResponse> {
    if (this.sandbox) {
      return { transactionId, status: 'success', message: 'SANDBOX - payment successful' };
    }
    return { transactionId, status: 'pending', message: 'Status check not implemented' };
  }

  validateWebhook(payload: any, signature: string): boolean {
    return !!payload;
  }
}

export default new MPesaProvider();
