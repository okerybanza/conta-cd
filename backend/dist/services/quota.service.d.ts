import { UsageMetric } from './usage.service';
export type QuotaMetric = UsageMetric;
export type PackageFeature = 'expenses' | 'accounting' | 'recurring_invoices' | 'api' | 'custom_templates' | 'multi_currency' | 'advanced_reports' | 'workflows' | 'custom_branding' | 'stock' | 'hr';
export declare class QuotaService {
    /**
     * Obtenir la limite d'une métrique pour une entreprise
     */
    getLimit(companyId: string, metric: QuotaMetric): Promise<number | null>;
    /**
     * Vérifier si une limite est atteinte
     */
    isLimitReached(companyId: string, metric: QuotaMetric): Promise<boolean>;
    /**
     * Vérifier si une entreprise peut créer une ressource (vérifie la limite)
     */
    canCreate(companyId: string, metric: QuotaMetric): Promise<boolean>;
    /**
     * Vérifier une limite et lancer une erreur si atteinte
     */
    checkLimit(companyId: string, metric: QuotaMetric): Promise<void>;
    /**
     * Vérifier si une fonctionnalité est disponible
     */
    checkFeature(companyId: string, feature: PackageFeature): Promise<boolean>;
    /**
     * Vérifier une fonctionnalité et lancer une erreur si non disponible
     */
    requireFeature(companyId: string, feature: PackageFeature): Promise<void>;
    /**
     * Obtenir toutes les limites d'une entreprise
     */
    getAllLimits(companyId: string): Promise<Record<QuotaMetric, number | null>>;
    /**
     * Obtenir toutes les fonctionnalités d'une entreprise
     */
    getAllFeatures(companyId: string): Promise<Record<PackageFeature, boolean>>;
    /**
     * Obtenir le résumé des quotas (limites et usage actuel)
     */
    getQuotaSummary(companyId: string): Promise<{
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
    }>;
}
declare const _default: QuotaService;
export default _default;
//# sourceMappingURL=quota.service.d.ts.map