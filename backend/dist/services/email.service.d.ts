export interface EmailData {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
    from?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer;
        contentType?: string;
    }>;
}
export declare class EmailService {
    private transporter;
    private templatesPath;
    constructor();
    private initializeTransporter;
    private loadTemplate;
    private compileTemplate;
    sendEmail(emailData: EmailData): Promise<boolean>;
    testConnection(): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map