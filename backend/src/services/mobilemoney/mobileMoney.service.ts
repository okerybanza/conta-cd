import logger from '../../utils/logger';
import cacheService from '../cache.service';
import { AirtelMoneyProvider } from './airtel.provider';
import { MPesaProvider } from './mpesa.provider';
import { IMobileMoneyProvider, MobileMoneyPaymentRequest, MobileMoneyPaymentResponse } from './mobileMoney.interface';

export class MobileMoneyService {
  private providers: Map<string, IMobileMoneyProvider> = new Map();

  constructor() {
    this.providers.set('airtel', new AirtelMoneyProvider());
    this.providers.set('mpesa', new MPesaProvider());
  }

  getProvider(name: string): IMobileMoneyProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) throw new Error(`Provider '${name}' not supported. Available: ${[...this.providers.keys()].join(', ')}`);
    return provider;
  }

  getAvailableProviders(): string[] {
    return [...this.providers.keys()];
  }

  async initiatePayment(provider: string, req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    const p = this.getProvider(provider);
    logger.info('Initiating mobile money payment', { provider, reference: req.reference, amount: req.amount });

    const result = await p.initiatePayment(req);

    // Stocker en cache pour polling de statut (TTL 30 min)
    if (result.transactionId) {
      await cacheService.set(`mobilemoney:${result.transactionId}`, {
        provider,
        reference: req.reference,
        status: result.status,
        initiatedAt: new Date().toISOString(),
      }, 1800);
    }

    logger.info('Mobile money payment initiated', { provider, transactionId: result.transactionId, status: result.status });
    return result;
  }

  async checkStatus(provider: string, transactionId: string) {
    const p = this.getProvider(provider);
    const result = await p.checkStatus(transactionId);

    // Mettre à jour le cache
    const cached = await cacheService.get<any>(`mobilemoney:${transactionId}`);
    if (cached) {
      await cacheService.set(`mobilemoney:${transactionId}`, { ...cached, status: result.status }, 1800);
    }

    return result;
  }

  validateWebhook(provider: string, payload: any, signature: string): boolean {
    return this.getProvider(provider).validateWebhook(payload, signature);
  }
}

export default new MobileMoneyService();
