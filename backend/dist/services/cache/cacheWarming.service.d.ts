export declare class CacheWarmingService {
    /**
     * Warm dashboard cache for a specific company
     */
    warmDashboardCache(companyId: string): Promise<void>;
    /**
     * Warm critical caches for a specific company
     */
    warmCompanyCache(companyId: string): Promise<void>;
    /**
     * Warm caches for all active and recently active companies
     * For the first version, we warm the most recently created 10 companies
     */
    warmAllActiveCompanies(): Promise<void>;
}
declare const _default: CacheWarmingService;
export default _default;
//# sourceMappingURL=cacheWarming.service.d.ts.map