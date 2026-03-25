import api from './api';
import { API_BASE_URL } from '../config/api.config';

export interface PlatformBranding {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  emailLogoUrl: string | null;
  pdfLogoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  primaryFont: string | null;
  secondaryFont: string | null;
  theme: 'light' | 'dark' | 'auto' | null;
  createdAt: string;
  updatedAt: string;
}

class BrandingService {
  private cache: PlatformBranding | null = null;
  private cacheTimestamp: number = 0;
  // Cache mémoire (pour la session actuelle)
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  // Cache persistant (entre rechargements / nouvelles sessions)
  private readonly STORAGE_KEY = 'conta_platform_branding';
  private readonly STORAGE_TTL = 60 * 60 * 1000; // 1 heure

  async getBranding(): Promise<PlatformBranding> {
    const now = Date.now();
    
    // 1) Cache mémoire si disponible et récent
    if (this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache;
    }

    // 2) Cache localStorage (entre rechargements / onglets)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as { data: PlatformBranding; timestamp: number };
          if (now - stored.timestamp < this.STORAGE_TTL) {
            this.cache = stored.data;
            this.cacheTimestamp = now;
            return this.cache;
          }
        }
      } catch {
        // Si problème de parsing/localStorage, on ignore et on continue vers l'API
      }
    }

    try {
      // Utiliser la route publique /branding au lieu de /super-admin/branding
      const response = await api.get('/branding');
      this.cache = response.data.data;
      this.cacheTimestamp = now;

      // Mettre aussi en cache persistant si possible
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify({ data: this.cache, timestamp: now })
          );
        } catch {
          // Si stockage impossible (quota, mode privé, ...), on ignore
        }
      }

      return this.cache || null as any;
    } catch (error: any) {
      const status = error?.response?.status;

      // 1) Si on a déjà un cache mémoire, on s'en sert
      if (this.cache) {
        console.info('Branding API error, using in-memory cache', { status });
        return this.cache;
      }

      // 2) Sinon, essayer une valeur éventuellement expirée de localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem(this.STORAGE_KEY);
          if (raw) {
            const stored = JSON.parse(raw) as { data: PlatformBranding; timestamp: number };
            // Utiliser console.debug pour les erreurs 404 qui sont normales (fallback)
            if (status === 404) {
              console.debug('Branding API not available (404), using cached branding from localStorage');
            } else {
              console.info('Branding API error, using stored branding from localStorage', {
                status,
              });
            }
            this.cache = stored.data;
            this.cacheTimestamp = now;
            return this.cache;
          }
        } catch {
          // On tombera sur les valeurs par défaut plus bas
        }
      }

      // 3) Logging doux selon le type d'erreur
      if (status === 429) {
        // Trop de requêtes : ce n'est pas critique pour l'utilisateur, on reste discret
      } else {
        console.error('Could not fetch branding, using defaults', error);
      }

      // 4) Dernier recours : valeurs par défaut produit
      // Utiliser le logo depuis public (toujours accessible)
      const defaultLogo = '/logo-color.png';
      
      return {
        id: '',
        logoUrl: defaultLogo,
        faviconUrl: '/uploads/logos/icon-color.png',
        emailLogoUrl: defaultLogo,
        pdfLogoUrl: defaultLogo,
        primaryColor: '#0D3B66',
        secondaryColor: null,
        accentColor: null,
        backgroundColor: '#FFFFFF',
        primaryFont: 'Arial, sans-serif',
        secondaryFont: null,
        theme: 'light',
        createdAt: '',
        updatedAt: '',
      };
    }
  }

  getLogoUrl(branding: PlatformBranding | null): string {
    if (branding?.logoUrl) {
      // Si c'est déjà une URL complète, la retourner telle quelle
      if (branding.logoUrl.startsWith('http://') || branding.logoUrl.startsWith('https://')) {
        return branding.logoUrl;
      }
      
      // Si c'est le logo par défaut depuis public, le retourner directement
      if (branding.logoUrl === '/logo-color.png' || branding.logoUrl.includes('/logo-color.png')) {
        return '/logo-color.png';
      }
      
      // En production, utiliser l'URL complète si disponible
      const baseUrl = API_BASE_URL.replace('/api/v1', '');
      if (baseUrl && (baseUrl.includes('conta.cd') || baseUrl.includes('https://'))) {
        const logoUrl = `${baseUrl}${branding.logoUrl}`;
        return logoUrl;
      }
      
      // Si c'est une URL relative qui commence par /uploads, 
      // on retourne le logo par défaut pour éviter les erreurs 404
      if (branding.logoUrl.startsWith('/uploads/')) {
        // Vérifier si le fichier existe en faisant une requête HEAD (mais on ne peut pas faire ça ici)
        // Donc on retourne le logo par défaut pour être sûr qu'il fonctionne
        return '/logo-color.png';
      }
      
      return branding.logoUrl;
    }
    // Fallback vers le logo depuis public (toujours accessible via le serveur frontend)
    return '/logo-color.png';
  }

  getFaviconUrl(branding: PlatformBranding | null): string {
    if (branding?.faviconUrl) {
      // Si c'est déjà une URL complète, la retourner telle quelle
      if (branding.faviconUrl.startsWith('http://') || branding.faviconUrl.startsWith('https://')) {
        return branding.faviconUrl;
      }
      // Sinon, utiliser l'URL relative directement (nginx proxy déjà /uploads)
      return branding.faviconUrl;
    }
    // Fallback vers le favicon par défaut
    return '/uploads/logos/icon-color.png';
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Mettre à jour le branding de la plateforme (Super Admin uniquement)
   */
  async updateBranding(data: Partial<PlatformBranding>): Promise<PlatformBranding> {
    const response = await api.put('/branding', data);
    
    // Invalider le cache après mise à jour
    this.invalidateCache();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // Ignorer les erreurs de localStorage
      }
    }
    
    return response.data.data;
  }

  /**
   * Réinitialiser le branding aux valeurs par défaut (Super Admin uniquement)
   */
  async resetBranding(): Promise<PlatformBranding> {
    const response = await api.post('/branding/reset');
    
    // Invalider le cache après réinitialisation
    this.invalidateCache();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // Ignorer les erreurs de localStorage
      }
    }
    
    return response.data.data;
  }
}

export default new BrandingService();

