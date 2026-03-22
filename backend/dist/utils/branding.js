"use strict";
/**
 * Utilitaires pour récupérer les logos et icônes du branding
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogoUrl = getLogoUrl;
exports.getLogoWhiteUrl = getLogoWhiteUrl;
exports.getFaviconUrl = getFaviconUrl;
exports.getIconWhiteUrl = getIconWhiteUrl;
exports.getEmailLogoUrl = getEmailLogoUrl;
exports.getPdfLogoUrl = getPdfLogoUrl;
exports.invalidateBrandingCache = invalidateBrandingCache;
const platform_branding_service_1 = __importDefault(require("../services/platform-branding.service"));
let brandingCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
/**
 * Obtenir le branding (avec cache)
 */
async function getBranding() {
    const now = Date.now();
    if (!brandingCache || now - cacheTimestamp > CACHE_DURATION) {
        brandingCache = await platform_branding_service_1.default.getBranding();
        cacheTimestamp = now;
    }
    return brandingCache;
}
/**
 * Obtenir l'URL complète d'un logo
 */
function getFullLogoUrl(relativeUrl) {
    if (!relativeUrl)
        return null;
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    // Construire l'URL complète avec le backend URL
    // En production, utiliser FRONTEND_URL pour que les images soient accessibles publiquement
    const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}${relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl}`;
}
/**
 * Obtenir le logo principal (couleur)
 */
async function getLogoUrl() {
    const branding = await getBranding();
    return getFullLogoUrl(branding.logoUrl);
}
/**
 * Obtenir le logo blanc (pour backgrounds colorés)
 */
async function getLogoWhiteUrl() {
    // Pour l'instant, on utilise le logo blanc depuis le système de fichiers
    // On pourrait ajouter logoWhiteUrl dans le branding plus tard
    const branding = await getBranding();
    if (branding.logoUrl) {
        // Remplacer logo-color.png par logo-white.png
        const whiteUrl = branding.logoUrl.replace('logo-color.png', 'logo-white.png');
        return getFullLogoUrl(whiteUrl);
    }
    return null;
}
/**
 * Obtenir le favicon
 */
async function getFaviconUrl() {
    const branding = await getBranding();
    return getFullLogoUrl(branding.faviconUrl);
}
/**
 * Obtenir l'icône blanche (pour backgrounds colorés)
 */
async function getIconWhiteUrl() {
    const branding = await getBranding();
    if (branding.faviconUrl) {
        // Remplacer icon-color.png par icon-white.png
        const whiteUrl = branding.faviconUrl.replace('icon-color.png', 'icon-white.png');
        return getFullLogoUrl(whiteUrl);
    }
    return null;
}
/**
 * Obtenir le logo pour les emails
 */
async function getEmailLogoUrl() {
    const branding = await getBranding();
    return getFullLogoUrl(branding.emailLogoUrl || branding.logoUrl);
}
/**
 * Obtenir le logo pour les PDFs
 */
async function getPdfLogoUrl() {
    const branding = await getBranding();
    return getFullLogoUrl(branding.pdfLogoUrl || branding.logoUrl);
}
/**
 * Invalider le cache (à appeler après une mise à jour du branding)
 */
function invalidateBrandingCache() {
    brandingCache = null;
    cacheTimestamp = 0;
}
//# sourceMappingURL=branding.js.map