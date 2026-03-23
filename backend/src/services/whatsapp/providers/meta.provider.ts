import axios from 'axios';
import logger from '../../../utils/logger';
import type { WhatsAppSendTextInput, WhatsAppSendTemplateInput, WhatsAppSendResponse } from './types';

export class MetaCloudWhatsAppProvider {
  name = 'meta';
  private graphVersion = process.env.WHATSAPP_META_GRAPH_VERSION || 'v21.0';
  private accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
  private phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;

  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  private normalizeTo(to: string): string {
    const cleaned = to.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('243')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+243${cleaned.slice(1)}`;
    return `+243${cleaned}`;
  }

  private endpoint(): string {
    return `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
  }

  async sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendResponse> {
    if (!this.isConfigured()) {
      logger.warn('Meta WhatsApp not configured, cannot send message');
      return { ok: false, error: 'Meta WhatsApp not configured' };
    }

    try {
      // IMPORTANT: Le "text" libre n'est délivrable que dans la fenêtre 24h après message utilisateur.
      // Pour les notifications "business-initiated" (factures/rappels), il faut un TEMPLATE approuvé.
      const payload = {
        messaging_product: 'whatsapp',
        to: this.normalizeTo(input.to),
        type: 'text',
        text: { body: input.message, preview_url: true },
      };

      const resp = await axios.post(this.endpoint(), payload, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 30000,
      });

      const id = resp.data?.messages?.[0]?.id;

      logger.info('Meta WhatsApp message sent', {
        to: input.to,
        messageId: id,
      });

      return { ok: true, providerMessageId: id };
    } catch (error: any) {
      logger.error('Error sending Meta WhatsApp message', {
        to: input.to,
        error: error.response?.data || error.message,
      });

      // Gérer les erreurs spécifiques de Meta
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;

      return { ok: false, error: errorMessage, providerMessageId: errorCode?.toString() };
    }
  }

  async sendTemplate(input: WhatsAppSendTemplateInput): Promise<WhatsAppSendResponse> {
    if (!this.isConfigured()) {
      logger.warn('Meta WhatsApp not configured, cannot send template');
      return { ok: false, error: 'Meta WhatsApp not configured' };
    }

    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: this.normalizeTo(input.to),
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: input.languageCode || 'fr' },
        },
      };

      if (input.components && input.components.length > 0) {
        payload.template.components = input.components;
      }

      const resp = await axios.post(this.endpoint(), payload, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 30000,
      });

      const id = resp.data?.messages?.[0]?.id;

      logger.info('Meta WhatsApp template sent', {
        to: input.to,
        templateName: input.templateName,
        messageId: id,
      });

      return { ok: true, providerMessageId: id };
    } catch (error: any) {
      logger.error('Error sending Meta WhatsApp template', {
        to: input.to,
        templateName: input.templateName,
        error: error.response?.data || error.message,
      });

      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;

      return { ok: false, error: errorMessage, providerMessageId: errorCode?.toString() };
    }
  }
}

