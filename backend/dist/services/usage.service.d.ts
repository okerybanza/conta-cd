export type UsageMetric = 'customers' | 'products' | 'users' | 'emails_sent' | 'whatsapp_sent' | 'suppliers' | 'expenses' | 'invoices' | 'recurring_invoices' | 'storage';
export declare class UsageService {
    /**
     * Obtenir la période actuelle (format: "YYYY-MM")
     */
    private getCurrentPeriod;
    /**
     * Incrémenter un compteur d'usage
     */
    increment(companyId: string, metric: UsageMetric, amount?: number, period?: string): Promise<void>;
    /**
     * Décrémenter un compteur d'usage
     */
    decrement(companyId: string, metric: UsageMetric, amount?: number, period?: string): Promise<void>;
    /**
     * Obtenir la valeur d'un compteur
     */
    get(companyId: string, metric: UsageMetric, period?: string): Promise<number>;
    /**
     * Vérifier si une limite est atteinte
     */
    checkLimit(companyId: string, metric: UsageMetric, limit: number | null): Promise<boolean>;
    /**
     * Obtenir tous les usages d'une entreprise pour la période actuelle
     */
    getAll(companyId: string, period?: string): Promise<Record<UsageMetric, number>>;
    /**
     * Réinitialiser les compteurs pour une nouvelle période
     * (Appelé automatiquement au début de chaque mois)
     */
    resetPeriod(companyId: string, period: string): Promise<void>;
    /**
     * Obtenir l'usage d'une métrique pour plusieurs périodes
     */
    getHistory(companyId: string, metric: UsageMetric, months?: number): Promise<Array<{
        period: string;
        count: number;
    }>>;
}
declare const _default: UsageService;
export default _default;
//# sourceMappingURL=usage.service.d.ts.map