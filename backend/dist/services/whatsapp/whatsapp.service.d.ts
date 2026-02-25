export interface WhatsAppSendOptions {
    to: string;
    message: string;
}
export interface WhatsAppSendResult {
    ok: boolean;
    providerMessageId?: string;
    error?: string;
}
export declare class WhatsAppService {
    isServiceConfigured(): boolean;
    sendText(options: WhatsAppSendOptions): Promise<WhatsAppSendResult>;
}
declare const _default: WhatsAppService;
export default _default;
//# sourceMappingURL=whatsapp.service.d.ts.map