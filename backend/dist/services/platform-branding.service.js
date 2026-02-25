"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformBrandingService = void 0;
const crypto_1 = require("crypto");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const updateBrandingSchema = zod_1.z.object({
    logoUrl: zod_1.z.string().optional(), // Accepte URLs relatives ou absolues
    faviconUrl: zod_1.z.string().optional(),
    emailLogoUrl: zod_1.z.string().optional(),
    pdfLogoUrl: zod_1.z.string().optional(),
    primaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    backgroundColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    primaryFont: zod_1.z.string().max(100).optional(),
    secondaryFont: zod_1.z.string().max(100).optional(),
    theme: zod_1.z.enum(['light', 'dark', 'auto']).optional(),
});
class PlatformBrandingService {
    /**
     * Obtenir la configuration du branding
     */
    async getBranding() {
        try {
            let branding = await database_1.default.platform_branding.findFirst({
                orderBy: {
                    created_at: 'desc',
                },
            });
            // Si pas de branding, créer avec les valeurs par défaut
            if (!branding) {
                try {
                    branding = await database_1.default.platform_branding.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
                            logo_url: '/uploads/logos/logo-color.png',
                            favicon_url: '/uploads/logos/icon-color.png',
                            email_logo_url: '/uploads/logos/logo-color.png',
                            pdf_logo_url: '/uploads/logos/logo-color.png',
                            primary_color: '#0D3B66',
                            background_color: '#FFFFFF',
                            primary_font: 'Arial, sans-serif',
                            theme: 'light',
                            updated_at: new Date(),
                        },
                    });
                }
                catch (createError) {
                    // Si erreur lors de la création (table n'existe pas, etc.), retourner des valeurs par défaut
                    logger_1.default.warn('Could not create default branding, returning defaults', createError);
                    return {
                        id: '',
                        logoUrl: '/uploads/logos/logo-color.png',
                        faviconUrl: '/uploads/logos/icon-color.png',
                        emailLogoUrl: '/uploads/logos/logo-color.png',
                        pdfLogoUrl: '/uploads/logos/logo-color.png',
                        primaryColor: '#0D3B66',
                        secondaryColor: null,
                        accentColor: null,
                        backgroundColor: '#FFFFFF',
                        primaryFont: 'Arial, sans-serif',
                        secondaryFont: null,
                        theme: 'light',
                        updatedBy: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                }
            }
            return branding;
        }
        catch (error) {
            // En cas d'erreur, retourner des valeurs par défaut
            logger_1.default.error('Error fetching branding, returning defaults', error);
            return {
                id: '',
                logoUrl: '/uploads/logos/logo-color.png',
                faviconUrl: '/uploads/logos/icon-color.png',
                emailLogoUrl: '/uploads/logos/logo-color.png',
                pdfLogoUrl: '/uploads/logos/logo-color.png',
                primaryColor: '#0D3B66',
                secondaryColor: null,
                accentColor: null,
                backgroundColor: '#FFFFFF',
                primaryFont: 'Arial, sans-serif',
                secondaryFont: null,
                theme: 'light',
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
    }
    /**
     * Mettre à jour le branding
     */
    async updateBranding(userId, data) {
        const validated = updateBrandingSchema.parse(data);
        // Mapper les champs camelCase vers snake_case
        const prismaData = {};
        if (validated.logoUrl !== undefined)
            prismaData.logo_url = validated.logoUrl;
        if (validated.faviconUrl !== undefined)
            prismaData.favicon_url = validated.faviconUrl;
        if (validated.emailLogoUrl !== undefined)
            prismaData.email_logo_url = validated.emailLogoUrl;
        if (validated.pdfLogoUrl !== undefined)
            prismaData.pdf_logo_url = validated.pdfLogoUrl;
        if (validated.primaryColor !== undefined)
            prismaData.primary_color = validated.primaryColor;
        if (validated.secondaryColor !== undefined)
            prismaData.secondary_color = validated.secondaryColor;
        if (validated.accentColor !== undefined)
            prismaData.accent_color = validated.accentColor;
        if (validated.backgroundColor !== undefined)
            prismaData.background_color = validated.backgroundColor;
        if (validated.primaryFont !== undefined)
            prismaData.primary_font = validated.primaryFont;
        if (validated.secondaryFont !== undefined)
            prismaData.secondary_font = validated.secondaryFont;
        if (validated.theme !== undefined)
            prismaData.theme = validated.theme;
        // Vérifier si un branding existe
        const existing = await database_1.default.platform_branding.findFirst({
            orderBy: {
                created_at: 'desc',
            },
        });
        let branding;
        if (existing) {
            // Mettre à jour
            branding = await database_1.default.platform_branding.update({
                where: { id: existing.id },
                data: {
                    ...prismaData,
                    updated_by: userId,
                    updated_at: new Date(),
                },
            });
        }
        else {
            // Créer
            branding = await database_1.default.platform_branding.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    ...prismaData,
                    updated_by: userId,
                    updated_at: new Date(),
                },
            });
        }
        logger_1.default.info('Platform branding updated', {
            userId,
            brandingId: branding.id,
        });
        // Invalider le cache du branding
        const { invalidateBrandingCache } = await Promise.resolve().then(() => __importStar(require('../utils/branding')));
        invalidateBrandingCache();
        return branding;
    }
    /**
     * Réinitialiser le branding aux valeurs par défaut
     */
    async resetBranding(userId) {
        const defaultBranding = {
            logoUrl: undefined,
            faviconUrl: undefined,
            emailLogoUrl: undefined,
            pdfLogoUrl: undefined,
            primaryColor: '#0D3B66',
            secondaryColor: undefined,
            accentColor: undefined,
            backgroundColor: '#FFFFFF',
            primaryFont: 'Arial, sans-serif',
            secondaryFont: undefined,
            theme: 'light',
        };
        const branding = await this.updateBranding(userId, defaultBranding);
        // Invalider le cache du branding
        const { invalidateBrandingCache } = await Promise.resolve().then(() => __importStar(require('../utils/branding')));
        invalidateBrandingCache();
        return branding;
    }
}
exports.PlatformBrandingService = PlatformBrandingService;
exports.default = new PlatformBrandingService();
//# sourceMappingURL=platform-branding.service.js.map