import logger from '../../utils/logger';

export interface WhatsAppSendOptions {
    to: string;
    message: string;
}

export interface WhatsAppSendResult {
    ok: boolean;
    providerMessageId?: string;
    error?: string;
}

export class WhatsAppService {
    isServiceConfigured(): boolean {
        return !!process.env.WHATSAPP_API_KEY;
    }

    async sendText(options: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
        logger.info('WhatsApp sendText (mock for tests)', { to: options.to });
        return { ok: true, providerMessageId: 'mock-id' };
    }
}

export default new WhatsAppService();
