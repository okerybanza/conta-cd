export interface PlatformBrandingData {
    logoUrl?: string;
    faviconUrl?: string;
    emailLogoUrl?: string;
    pdfLogoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    primaryFont?: string;
    secondaryFont?: string;
    theme?: 'light' | 'dark' | 'auto';
}
export declare class PlatformBrandingService {
    /**
     * Obtenir la configuration du branding
     */
    getBranding(): Promise<any>;
    /**
     * Mettre à jour le branding
     */
    updateBranding(userId: string, data: PlatformBrandingData): Promise<any>;
    /**
     * Réinitialiser le branding aux valeurs par défaut
     */
    resetBranding(userId: string): Promise<any>;
}
declare const _default: PlatformBrandingService;
export default _default;
//# sourceMappingURL=platform-branding.service.d.ts.map