export interface WhatsAppSendTextInput {
    to: string;
    message: string;
}
export interface WhatsAppSendTemplateInput {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: Array<{
        type: 'header' | 'body' | 'button';
        parameters?: Array<{
            type: 'text' | 'image' | 'document' | 'video';
            text?: string;
            image?: {
                link?: string;
                id?: string;
            };
            document?: {
                link?: string;
                id?: string;
            };
            video?: {
                link?: string;
                id?: string;
            };
        }>;
    }>;
}
export interface WhatsAppSendResponse {
    ok: boolean;
    providerMessageId?: string;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map