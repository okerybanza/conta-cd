export declare class PlatformSettingsService {
    getSettings(): Promise<any>;
    getPayPalConfig(): Promise<{
        enabled: any;
        clientId: any;
        secretKey: any;
        mode: any;
        webhookId: any;
    }>;
    getSmtpConfig(): Promise<{
        host: any;
        port: any;
        user: any;
        pass: any;
        from: any;
        secure: any;
    }>;
}
declare const _default: PlatformSettingsService;
export default _default;
//# sourceMappingURL=platform-settings.service.d.ts.map