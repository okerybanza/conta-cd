"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = __importDefault(require("../../utils/logger"));
const dashboard_service_1 = __importDefault(require("../dashboard.service"));
const settings_service_1 = __importDefault(require("../settings.service"));
const account_service_1 = __importDefault(require("../account.service"));
class CacheWarmingService {
    /**
     * Warm dashboard cache for a specific company
     */
    async warmDashboardCache(companyId) {
        try {
            await dashboard_service_1.default.getDashboardStats(companyId);
            logger_1.default.debug(`Dashboard cache warmed for company: ${companyId}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to warm dashboard cache for company: ${companyId}`, { error: error.message });
        }
    }
    /**
     * Warm critical caches for a specific company
     */
    async warmCompanyCache(companyId) {
        try {
            await Promise.all([
                this.warmDashboardCache(companyId),
                settings_service_1.default.getCompanySettings(companyId), // Will trigger caching in its implementation if applicable
                account_service_1.default.list(companyId), // Will trigger caching
            ]);
            logger_1.default.info(`Critical caches warmed for company: ${companyId}`);
        }
        catch (error) {
            logger_1.default.error(`Error warming caches for company: ${companyId}`, { error: error.message });
        }
    }
    /**
     * Warm caches for all active and recently active companies
     * For the first version, we warm the most recently created 10 companies
     */
    async warmAllActiveCompanies() {
        logger_1.default.info('🚀 Starting cache warming process...');
        const startTime = Date.now();
        try {
            const companies = await database_1.default.companies.findMany({
                where: { deleted_at: null },
                select: { id: true },
                orderBy: { created_at: 'desc' },
                take: 20, // Limit to top 20 for warming
            });
            logger_1.default.info(`Found ${companies.length} active companies to warm.`);
            // Warm sequentially or in small batches to avoid overloading DB
            for (const company of companies) {
                await this.warmCompanyCache(company.id);
            }
            const duration = Date.now() - startTime;
            logger_1.default.info(`✅ Cache warming completed in ${duration}ms`);
        }
        catch (error) {
            logger_1.default.error('Cache warming process failed', { error: error.message });
        }
    }
}
exports.CacheWarmingService = CacheWarmingService;
exports.default = new CacheWarmingService();
//# sourceMappingURL=cacheWarming.service.js.map