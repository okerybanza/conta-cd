export interface PackageLimits {
    customers?: number | null;
    products?: number | null;
    users?: number | null;
    emails_per_month?: number | null;
    suppliers?: number | null;
    storage_mb?: number | null;
    invoices?: number | null;
    expenses?: number | null;
    recurring_invoices?: number | null;
}
export interface PackageFeatures {
    expenses?: boolean;
    accounting?: boolean;
    recurring_invoices?: boolean;
    api?: boolean;
    custom_templates?: boolean;
    multi_currency?: boolean;
    advanced_reports?: boolean;
    workflows?: boolean;
    custom_branding?: boolean;
    stock?: boolean;
    hr?: boolean;
}
export declare class PackageService {
    /**
     * Obtenir tous les packages actifs
     */
    getAll(): Promise<any[]>;
    /**
     * Obtenir un package par ID
     */
    getById(packageId: string): Promise<any>;
    /**
     * Obtenir un package par code
     */
    getByCode(code: string): Promise<any>;
    /**
     * Obtenir les limites d'un package
     */
    getLimits(packageId: string): Promise<PackageLimits>;
    /**
     * Obtenir les fonctionnalités d'un package
     */
    getFeatures(packageId: string): Promise<PackageFeatures>;
    /**
     * Vérifier si un package a une fonctionnalité
     */
    hasFeature(packageId: string, feature: keyof PackageFeatures): Promise<boolean>;
    /**
     * Obtenir la limite d'une métrique pour un package
     */
    getLimit(packageId: string, metric: keyof PackageLimits): Promise<number | null>;
    /**
     * Créer un nouveau package (Super Admin uniquement)
     */
    create(data: {
        code: string;
        name: string;
        description?: string;
        price: number;
        currency?: string;
        limits?: PackageLimits;
        features?: PackageFeatures;
        isActive?: boolean;
        displayOrder?: number;
    }): Promise<any>;
    /**
     * Mettre à jour un package (Super Admin uniquement)
     */
    update(packageId: string, data: {
        name?: string;
        description?: string;
        price?: number;
        limits?: PackageLimits;
        features?: PackageFeatures;
        isActive?: boolean;
        displayOrder?: number;
    }): Promise<any>;
    /**
     * Supprimer un package (Super Admin uniquement)
     * Conditions :
     * - Ne peut pas être supprimé s'il a des subscriptions actives
     * - Ne peut pas être supprimé s'il est le seul plan actif
     */
    delete(packageId: string, force?: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Obtenir le nombre de subscriptions actives pour un package
     */
    getActiveSubscriptionsCount(packageId: string): Promise<number>;
}
declare const _default: PackageService;
export default _default;
//# sourceMappingURL=package.service.d.ts.map