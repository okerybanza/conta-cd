import { randomUUID } from 'crypto';
import prisma from '../config/database';
import logger from '../utils/logger';
import { z } from 'zod';

const updateBrandingSchema = z.object({
  logoUrl: z.string().optional(), // Accepte URLs relatives ou absolues
  faviconUrl: z.string().optional(),
  emailLogoUrl: z.string().optional(),
  pdfLogoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primaryFont: z.string().max(100).optional(),
  secondaryFont: z.string().max(100).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
});

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

export class PlatformBrandingService {
  /**
   * Obtenir la configuration du branding
   */
  async getBranding() {
    try {
      let branding = await prisma.platform_branding.findFirst({
        orderBy: {
          created_at: 'desc',
        },
      });

      // Si pas de branding, créer avec les valeurs par défaut
      if (!branding) {
        try {
          branding = await prisma.platform_branding.create({
            data: {
              id: randomUUID(),
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
        } catch (createError: any) {
          // Si erreur lors de la création (table n'existe pas, etc.), retourner des valeurs par défaut
          logger.warn('Could not create default branding, returning defaults', createError);
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
    } catch (error: any) {
      // En cas d'erreur, retourner des valeurs par défaut
      logger.error('Error fetching branding, returning defaults', error);
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
  async updateBranding(userId: string, data: PlatformBrandingData) {
    const validated = updateBrandingSchema.parse(data);

    // Mapper les champs camelCase vers snake_case
    const prismaData: any = {};
    if (validated.logoUrl !== undefined) prismaData.logo_url = validated.logoUrl;
    if (validated.faviconUrl !== undefined) prismaData.favicon_url = validated.faviconUrl;
    if (validated.emailLogoUrl !== undefined) prismaData.email_logo_url = validated.emailLogoUrl;
    if (validated.pdfLogoUrl !== undefined) prismaData.pdf_logo_url = validated.pdfLogoUrl;
    if (validated.primaryColor !== undefined) prismaData.primary_color = validated.primaryColor;
    if (validated.secondaryColor !== undefined) prismaData.secondary_color = validated.secondaryColor;
    if (validated.accentColor !== undefined) prismaData.accent_color = validated.accentColor;
    if (validated.backgroundColor !== undefined) prismaData.background_color = validated.backgroundColor;
    if (validated.primaryFont !== undefined) prismaData.primary_font = validated.primaryFont;
    if (validated.secondaryFont !== undefined) prismaData.secondary_font = validated.secondaryFont;
    if (validated.theme !== undefined) prismaData.theme = validated.theme;

    // Vérifier si un branding existe
    const existing = await prisma.platform_branding.findFirst({
      orderBy: {
        created_at: 'desc',
      },
    });

    let branding;

    if (existing) {
      // Mettre à jour
      branding = await prisma.platform_branding.update({
        where: { id: existing.id },
        data: {
          ...prismaData,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    } else {
      // Créer
      branding = await prisma.platform_branding.create({
        data: {
          id: randomUUID(),
          ...prismaData,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    }

    logger.info('Platform branding updated', {
      userId,
      brandingId: branding.id,
    });

    // Invalider le cache du branding
    const { invalidateBrandingCache } = await import('../utils/branding');
    invalidateBrandingCache();

    return branding;
  }

  /**
   * Réinitialiser le branding aux valeurs par défaut
   */
  async resetBranding(userId: string) {
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
      theme: 'light' as const,
    };

    const branding = await this.updateBranding(userId, defaultBranding);
    
    // Invalider le cache du branding
    const { invalidateBrandingCache } = await import('../utils/branding');
    invalidateBrandingCache();
    
    return branding;
  }
}

export default new PlatformBrandingService();

