export interface CreateContaUserData {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    conta_role: 'superadmin' | 'admin' | 'support' | 'developer' | 'sales' | 'finance' | 'marketing';
    conta_permissions?: Record<string, any>;
}
export declare class SuperAdminService {
    /**
     * Obtenir toutes les entreprises
     */
    getAllCompanies(filters?: {
        search?: string;
        plan?: string;
        country?: string;
        isActive?: boolean;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        companies: any;
        total: any;
        limit: number;
        offset: number;
    }>;
    /**
     * Obtenir une entreprise par ID
     */
    getCompanyById(companyId: string): Promise<any>;
    /**
     * Obtenir l'historique des modifications d'un plan
     */
    getPackageHistory(packageId: string): Promise<any>;
    /**
     * Obtenir l'impact d'une modification de plan
     */
    getPackageModificationImpact(packageId: string, newLimits: Record<string, any>, newFeatures: Record<string, boolean>): Promise<{
        totalCompanies: any;
        companiesWithIssues: Array<{
            companyId: string;
            companyName: string;
            issues: Array<{
                metric: string;
                currentUsage: number;
                oldLimit: number | null;
                newLimit: number | null;
            }>;
        }>;
        featuresAdded: string[];
        featuresRemoved: string[];
        limitsIncreased: string[];
        limitsDecreased: string[];
    }>;
    /**
     * Obtenir l'usage réel d'une entreprise
     */
    getCompanyUsage(companyId: string): Promise<{
        customers: any;
        invoices: any;
        products: any;
        users: any;
        expenses: any;
        suppliers: any;
    }>;
    /**
     * Modifier le plan d'une entreprise
     */
    updateCompanySubscription(companyId: string, packageId: string, userId?: string): Promise<any>;
    /**
     * Suspendre ou activer une entreprise
     */
    updateCompanyStatus(companyId: string, status: 'active' | 'suspended', reason?: string, userId?: string): Promise<any>;
    /**
     * Créer un utilisateur Conta (interne)
     */
    createContaUser(data: CreateContaUserData): Promise<any>;
    /**
     * Mettre à jour un utilisateur Conta
     */
    updateContaUser(userId: string, data: Partial<CreateContaUserData>): Promise<any>;
    /**
     * Supprimer un utilisateur Conta
     */
    deleteContaUser(userId: string): Promise<any>;
    /**
     * Obtenir tous les utilisateurs Conta
     */
    getContaUsers(): Promise<any>;
    /**
     * Approuver un expert comptable
     */
    approveAccountant(accountantId: string, adminUserId: string): Promise<{
        id: any;
        email: any;
        first_name: any;
        last_name: any;
        profile: any;
    }>;
    /**
     * Rejeter un expert comptable
     */
    rejectAccountant(accountantId: string, reason: string, adminUserId: string): Promise<{
        id: any;
        email: any;
        first_name: any;
        last_name: any;
        rejected: boolean;
        reason: string;
    }>;
    /**
     * Obtenir les statistiques globales
     */
    getGlobalStats(): Promise<{
        companies: {
            total: any;
            active: any;
            inactive: number;
            newLast7Days: any;
            newLast30Days: any;
        };
        users: {
            total: any;
            activeLast30Days: any;
            accountants: any;
        };
        subscriptions: {
            total: any;
            byPlan: Record<string, number>;
            conversionRate: number;
        };
        revenue: {
            currentMonth: number;
            currentYear: number;
            projection: number;
        };
    }>;
    /**
     * Obtenir les données de revenus mensuels (12 derniers mois)
     */
    getMonthlyRevenueData(): Promise<{
        month: string;
        revenus: number;
    }[]>;
    /**
     * Obtenir tous les packages (y compris ceux désactivés mais utilisés)
     * Pour le superadmin, on doit voir tous les packages, même désactivés,
     * s'ils sont utilisés par des subscriptions actives
     */
    getAllPackagesForAdmin(): Promise<any>;
    /**
     * Obtenir les données de croissance des entreprises (12 derniers mois)
     */
    getCompanyGrowthData(): Promise<{
        month: string;
        entreprises: any;
    }[]>;
}
declare const _default: SuperAdminService;
export default _default;
//# sourceMappingURL=superadmin.service.d.ts.map