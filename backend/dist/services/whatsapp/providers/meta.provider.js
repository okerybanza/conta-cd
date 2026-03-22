"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaCloudWhatsAppProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class MetaCloudWhatsAppProvider {
    name = 'meta';
    graphVersion = process.env.WHATSAPP_META_GRAPH_VERSION || 'v21.0';
    accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    isConfigured() {
        return !!(this.accessToken && this.phoneNumberId);
    }
    normalizeTo(to) {
        const cleaned = to.replace(/\s+/g, '').replace(/-/g, '');
        if (cleaned.startsWith('+'))
            return cleaned;
        if (cleaned.startsWith('243'))
            return `+${cleaned}`;
        if (cleaned.startsWith('0'))
            return `+243${cleaned.slice(1)}`;
        return `+243${cleaned}`;
    }
    endpoint() {
        return `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
    }
    async sendText(input) {
        if (!this.isConfigured()) {
            logger_1.default.warn('Meta WhatsApp not configured, cannot send message');
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
            const resp = await axios_1.default.post(this.endpoint(), payload, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
                timeout: 30000,
            });
            const id = resp.data?.messages?.[0]?.id;
            logger_1.default.info('Meta WhatsApp message sent', {
                to: input.to,
                messageId: id,
            });
            return { ok: true, providerMessageId: id };
        }
        catch (error) {
            logger_1.default.error('Error sending Meta WhatsApp message', {
                to: input.to,
                error: error.response?.data || error.message,
            });
            // Gérer les erreurs spécifiques de Meta
            const errorMessage = error.response?.data?.error?.message || error.message;
            const errorCode = error.response?.data?.error?.code;
            return { ok: false, error: errorMessage, providerMessageId: errorCode?.toString() };
        }
    }
    async sendTemplate(input) {
        if (!this.isConfigured()) {
            logger_1.default.warn('Meta WhatsApp not configured, cannot send template');
            return { ok: false, error: 'Meta WhatsApp not configured' };
        }
        try {
            const payload = {
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
            const resp = await axios_1.default.post(this.endpoint(), payload, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
                timeout: 30000,
            });
            const id = resp.data?.messages?.[0]?.id;
            logger_1.default.info('Meta WhatsApp template sent', {
                to: input.to,
                templateName: input.templateName,
                messageId: id,
            });
            return { ok: true, providerMessageId: id };
        }
        catch (error) {
            logger_1.default.error('Error sending Meta WhatsApp template', {
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
exports.MetaCloudWhatsAppProvider = MetaCloudWhatsAppProvider;
//# sourceMappingURL=meta.provider.js.map