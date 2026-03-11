import axios from 'axios';
import prisma from '../config/database';
import logger from '../utils/logger';
import platformSettingsService from './platform-settings.service';

export interface MaxiCashInitPaymentInput {
  companyId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  customerPhone: string;
  reference: string;
}

export interface MaxiCashInitPaymentResult {
  success: boolean;
  transactionReference?: string;
  providerPayload?: any;
  error?: string;
}

export interface MaxiCashStatusResult {
  success: boolean;
  status?: string;
  raw?: any;
  error?: string;
}

/**
 * Service d'intégration MaxiCash (paiement mobile RDC).
 *
 * NOTE IMPORTANTE :
 * La documentation officielle MaxiCash n'est pas disponible dans le code.
 * L'implémentation ci-dessous suit une interface générique (montant, téléphone, référence)
 * et devra être ajustée une fois la spécification MaxiCash confirmée.
 */
export class MaxiCashService {
  /**
   * Récupérer la configuration MaxiCash pour une entreprise :
   * - Priorité aux champs de la table companies
   * - Fallback éventuel sur des variables d'environnement plateforme
   */
  private async getCompanyConfig(companyId: string) {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const enabled = (company as any).maxicash_enabled ?? false;
    const merchantId =
      (company as any).maxicash_merchant_id || process.env.MAXICASH_MERCHANT_ID;
    const secretKey =
      (company as any).maxicash_secret_key || process.env.MAXICASH_API_KEY;
    const subMerchantId = (company as any).maxicash_sub_merchant_id || null;
    const webhookUrl =
      (company as any).maxicash_webhook_url ||
      `${process.env.BACKEND_URL || ''}/api/v1/webhooks/maxicash`;

    if (!enabled) {
      throw new Error('MaxiCash is not enabled for this company');
    }

    if (!merchantId || !secretKey) {
      throw new Error('MaxiCash configuration is incomplete for this company');
    }

    return {
      company,
      enabled,
      merchantId,
      secretKey,
      subMerchantId,
      webhookUrl,
    };
  }

  /**
   * Initier un paiement MaxiCash pour une facture.
   */
  async initPayment(
    input: MaxiCashInitPaymentInput
  ): Promise<MaxiCashInitPaymentResult> {
    try {
      const { company, merchantId, secretKey, subMerchantId, webhookUrl } =
        await this.getCompanyConfig(input.companyId);

      // Récupérer la facture associée (principalement pour les logs / validations)
      const invoice = await prisma.invoices.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        throw new Error('Invoice not found for MaxiCash payment');
      }

      // Payload générique pour MaxiCash (à adapter selon la doc officielle)
      const payload: any = {
        merchantId,
        secretKey,
        amount: input.amount,
        currency: input.currency || (invoice as any).currency || 'CDF',
        customerPhone: input.customerPhone,
        reference: input.reference || invoice.invoice_number,
        callbackUrl: webhookUrl,
        subMerchantId: subMerchantId || undefined,
      };

      logger.info('MaxiCash init payment request', {
        companyId: input.companyId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: payload.currency,
      });

      // L’URL réelle de MaxiCash devra être confirmée et/ou paramétrée
      const baseUrl =
        process.env.MAXICASH_API_URL || 'https://api.maxicash.net';

      const response = await axios.post(`${baseUrl}/payments/init`, payload, {
        timeout: 15000,
      });

      const data = response.data || {};

      const transactionRef =
        data.transactionReference ||
        data.transaction_id ||
        data.reference ||
        null;

      if (!transactionRef) {
        logger.warn('MaxiCash init payment response without transaction reference', {
          companyId: input.companyId,
          invoiceId: input.invoiceId,
          data,
        });
      }

      // Ici, on ne crée PAS encore de paiement interne tant que le webhook
      // de confirmation n'a pas été reçu. On stocke la référence côté invoice/payment
      // via d'autres services si nécessaire.

      return {
        success: true,
        transactionReference: transactionRef || undefined,
        providerPayload: data,
      };
    } catch (error: any) {
      logger.error('Error initiating MaxiCash payment', {
        error: error.message,
        companyId: input.companyId,
        invoiceId: input.invoiceId,
      });

      return {
        success: false,
        error: error.message || 'Error initiating MaxiCash payment',
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement MaxiCash déjà initié.
   */
  async checkPaymentStatus(
    companyId: string,
    transactionReference: string
  ): Promise<MaxiCashStatusResult> {
    try {
      const { merchantId, secretKey } = await this.getCompanyConfig(companyId);

      const baseUrl =
        process.env.MAXICASH_API_URL || 'https://api.maxicash.net';

      const payload: any = {
        merchantId,
        secretKey,
        transactionReference,
      };

      logger.info('MaxiCash check payment status request', {
        companyId,
        transactionReference,
      });

      const response = await axios.post(
        `${baseUrl}/payments/status`,
        payload,
        { timeout: 10000 }
      );

      const data = response.data || {};
      const status =
        data.status ||
        data.paymentStatus ||
        data.state ||
        'UNKNOWN';

      return {
        success: true,
        status,
        raw: data,
      };
    } catch (error: any) {
      logger.error('Error checking MaxiCash payment status', {
        error: error.message,
        companyId,
        transactionReference,
      });

      return {
        success: false,
        error: error.message || 'Error checking MaxiCash payment status',
      };
    }
  }

  /**
   * Traiter un webhook de confirmation MaxiCash.
   *
   * Cette méthode doit être appelée depuis le controller / webhook
   * exposé publiquement (route non authentifiée).
   */
  async handleWebhook(payload: any) {
    try {
      logger.info('Received MaxiCash webhook', {
        payload,
      });

      // Extraction générique des champs utiles
      const transactionReference =
        payload.transactionReference ||
        payload.transaction_id ||
        payload.reference;
      const status =
        payload.status ||
        payload.paymentStatus ||
        payload.state;
      const companyId =
        payload.companyId ||
        payload.merchantId ||
        null;

      if (!transactionReference) {
        logger.warn('MaxiCash webhook without transaction reference', {
          payload,
        });
        return;
      }

      // TODO DOC-XX : une fois le mapping exact défini,
      // retrouver ici le paiement / la facture via transactionReference
      // et valider le paiement dans le système (payment.service).

      logger.info('MaxiCash webhook processed (placeholder logic)', {
        transactionReference,
        status,
        companyId,
      });
    } catch (error: any) {
      logger.error('Error handling MaxiCash webhook', {
        error: error.message,
        payload,
      });
    }
  }
}

export default new MaxiCashService();

