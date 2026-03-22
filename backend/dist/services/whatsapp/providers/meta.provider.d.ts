import type { WhatsAppSendTextInput, WhatsAppSendTemplateInput, WhatsAppSendResponse } from './types';
export declare class MetaCloudWhatsAppProvider {
    name: string;
    private graphVersion;
    private accessToken;
    private phoneNumberId;
    isConfigured(): boolean;
    private normalizeTo;
    private endpoint;
    sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendResponse>;
    sendTemplate(input: WhatsAppSendTemplateInput): Promise<WhatsAppSendResponse>;
}
//# sourceMappingURL=meta.provider.d.ts.map