/**
 * Utilitaires pour récupérer les logos et icônes du branding
 */
/**
 * Obtenir le logo principal (couleur)
 */
export declare function getLogoUrl(): Promise<string | null>;
/**
 * Obtenir le logo blanc (pour backgrounds colorés)
 */
export declare function getLogoWhiteUrl(): Promise<string | null>;
/**
 * Obtenir le favicon
 */
export declare function getFaviconUrl(): Promise<string | null>;
/**
 * Obtenir l'icône blanche (pour backgrounds colorés)
 */
export declare function getIconWhiteUrl(): Promise<string | null>;
/**
 * Obtenir le logo pour les emails
 */
export declare function getEmailLogoUrl(): Promise<string | null>;
/**
 * Obtenir le logo pour les PDFs
 */
export declare function getPdfLogoUrl(): Promise<string | null>;
/**
 * Invalider le cache (à appeler après une mise à jour du branding)
 */
export declare function invalidateBrandingCache(): void;
//# sourceMappingURL=branding.d.ts.map