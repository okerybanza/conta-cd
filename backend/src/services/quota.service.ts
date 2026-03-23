import subscriptionService from './subscription.service';
import packageService from './package.service';
import usageService, { UsageMetric } from './usage.service';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export type QuotaMetric = UsageMetric;
export type PackageFeature =
  | 'expenses'
  | 'accounting'
  | 'recurring_invoices'
  | 'api'
  | 'custom_templates'
  | 'multi_currency'
  | 'advanced_reports'
  | 'workflows'
  | 'custom_branding'
  | 'stock'
  | 'hr';

export class QuotaService {
  /**
   * Obtenir la limite d'une métrique pour une entreprise
   */
  async getLimit(companyId: string, metric: QuotaMetric): Promise<number | null> {
    try {
      const subscription = await subscriptionService.getActive(companyId);
      // Mapper les métriques UsageMetric vers PackageLimits
      // SMS désactivé - ne garder que Email et WhatsApp
      const packageMetric = metric === 'emails_sent' ? 'emails_per_month'
        // : metric === 'sms_sent' ? 'sms_per_month' // SMS désactivé
        : metric as keyof import('./package.service').PackageLimits;
      const limit = await packageService.getLimit(subscription.package_id, packageMetric);
      return limit;
    } catch (error) {
      // Si pas d'abonnement, retourner null (illimité par défaut pour compatibilité)
      logger.warn(`No subscription found for company ${companyId}, returning null limit`);
      return null;
    }
  }

  /**
   * Vérifier si une limite est atteinte
   */
  async isLimitReached(companyId: string, metric: QuotaMetric): Promise<boolean> {
    const limit = await this.getLimit(companyId, metric);

    if (limit === null) {
      return false; // Illimité
    }

    const currentUsage = await usageService.get(companyId, metric);
    return currentUsage >= limit;
  }

  /**
   * Vérifier si une entreprise peut créer une ressource (vérifie la limite)
   */
  async canCreate(companyId: string, metric: QuotaMetric): Promise<boolean> {
    return !(await this.isLimitReached(companyId, metric));
  }

  /**
   * Vérifier une limite et lancer une erreur si atteinte
   */
  async checkLimit(companyId: string, metric: QuotaMetric): Promise<void> {
    if (await this.isLimitReached(companyId, metric)) {
      const limit = await this.getLimit(companyId, metric);
      const currentUsage = await usageService.get(companyId, metric);

      throw new CustomError(
        `Limit reached for ${metric}. Current: ${currentUsage}/${limit}. Please upgrade your plan.`,
        403,
        'QUOTA_EXCEEDED',
        {
          metric,
          limit,
          currentUsage,
        }
      );
    }
  }

  /**
   * Vérifier si une fonctionnalité est disponible
   */
  async checkFeature(companyId: string, feature: PackageFeature): Promise<boolean> {
    try {
      const subscription = await subscriptionService.getActive(companyId);
      return await packageService.hasFeature(subscription.package_id, feature);
    } catch (error) {
      // Si pas d'abonnement, retourner false (fonctionnalité non disponible)
      return false;
    }
  }

  /**
   * Vérifier une fonctionnalité et lancer une erreur si non disponible
   */
  async requireFeature(companyId: string, feature: PackageFeature): Promise<void> {
    const hasFeature = await this.checkFeature(companyId, feature);

    if (!hasFeature) {
      throw new CustomError(
        `Feature "${feature}" is not available in your plan. Please upgrade to access this feature.`,
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature }
      );
    }
  }

  /**
   * Obtenir toutes les limites d'une entreprise
   */
  async getAllLimits(companyId: string): Promise<Record<QuotaMetric, number | null>> {
    try {
      const subscription = await subscriptionService.getActive(companyId);
      const limits = await packageService.getLimits(subscription.package_id);

      // Récupérer l'usage de stockage actuel
      const storageService = (await import('./storage.service')).default;
      const storageUsage = await storageService.calculateStorageUsage(companyId);
      const storageLimitBytes = limits.storage_mb ? limits.storage_mb * 1024 * 1024 : null;

      return {
        customers: limits.customers ?? null,
        products: limits.products ?? null,
        users: limits.users ?? null,
        emails_sent: limits.emails_per_month ?? null,
        // sms_sent: limits.sms_per_month ?? null, // SMS désactivé
        whatsapp_sent: null, // WhatsApp n'a pas de limite spécifique pour l'instant
        suppliers: limits.suppliers ?? null,
        expenses: limits.expenses ?? null,
        invoices: limits.invoices ?? null,
        recurring_invoices: limits.recurring_invoices ?? null,
        storage: storageLimitBytes,
      };
    } catch (error) {
      // Retourner toutes les limites à null (illimité) si pas d'abonnement
      return {
        customers: null,
        products: null,
        users: null,
        emails_sent: null,
        // sms_sent: null, // SMS désactivé
        whatsapp_sent: null,
        suppliers: null,
        expenses: null,
        invoices: null,
        recurring_invoices: null,
        storage: null,
      };
    }
  }

  /**
   * Obtenir toutes les fonctionnalités d'une entreprise
   */
  async getAllFeatures(companyId: string): Promise<Record<PackageFeature, boolean>> {
    try {
      const subscription = await subscriptionService.getActive(companyId);
      const features = await packageService.getFeatures(subscription.package_id);

      return {
        expenses: features.expenses ?? false,
        accounting: features.accounting ?? false,
        recurring_invoices: features.recurring_invoices ?? false,
        api: features.api ?? false,
        custom_templates: features.custom_templates ?? false,
        multi_currency: features.multi_currency ?? false,
        advanced_reports: features.advanced_reports ?? false,
        workflows: features.workflows ?? false,
        custom_branding: features.custom_branding ?? false,
        stock: features.stock ?? false,
        hr: features.hr ?? false,
      };
    } catch (error) {
      // Retourner toutes les fonctionnalités à false si pas d'abonnement
      return {
        expenses: false,
        accounting: false,
        recurring_invoices: false,
        api: false,
        custom_templates: false,
        multi_currency: false,
        advanced_reports: false,
        workflows: false,
        custom_branding: false,
        stock: false,
        hr: false,
      };
    }
  }

  /**
   * Obtenir le résumé des quotas (limites et usage actuel)
   */
  async getQuotaSummary(companyId: string): Promise<{
    limits: Record<QuotaMetric, number | null>;
    usage: Record<QuotaMetric, number>;
    features: Record<PackageFeature, boolean>;
    currentPackage: {
      id: string;
      name: string;
      code: string;
      billingCycle: 'monthly' | 'yearly';
      status: 'active' | 'trial' | 'expired' | 'cancelled';
      startDate: string;
      endDate: string | null;
      trialEndsAt: string | null;
    } | null;
  }> {
    const limits = await this.getAllLimits(companyId);
    const usage = await usageService.getAll(companyId);
    const features = await this.getAllFeatures(companyId);

    // Récupérer l'abonnement actuel
    let currentPackage = null;
    try {
      const subscription = await subscriptionService.getActive(companyId);
      currentPackage = {
        id: subscription.id,
        name: subscription.packages.name,
        code: subscription.packages.code,
        billingCycle: subscription.billing_cycle as 'monthly' | 'yearly',
        status: subscription.status as 'active' | 'trial' | 'expired' | 'cancelled',
        startDate: subscription.start_date.toISOString(),
        endDate: subscription.end_date ? subscription.end_date.toISOString() : null,
        trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : null,
      };
    } catch (error) {
      // Pas d'abonnement actif, currentPackage reste null
      logger.warn(`No active subscription found for company ${companyId}`);
    }

    return {
      limits,
      usage,
      features,
      currentPackage,
    };
  }
}

export default new QuotaService();

