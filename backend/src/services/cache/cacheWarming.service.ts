import prisma from '../../config/database';
import logger from '../../utils/logger';
import dashboardService from '../dashboard.service';
import settingsService from '../settings.service';
import accountService from '../account.service';

export class CacheWarmingService {
    /**
     * Warm dashboard cache for a specific company
     */
    async warmDashboardCache(companyId: string) {
        try {
            await dashboardService.getDashboardStats(companyId);
            logger.debug(`Dashboard cache warmed for company: ${companyId}`);
        } catch (error: any) {
            logger.error(`Failed to warm dashboard cache for company: ${companyId}`, { error: error.message });
        }
    }

    /**
     * Warm critical caches for a specific company
     */
    async warmCompanyCache(companyId: string) {
        try {
            await Promise.all([
                this.warmDashboardCache(companyId),
                settingsService.getCompanySettings(companyId), // Will trigger caching in its implementation if applicable
                accountService.list(companyId), // Will trigger caching
            ]);
            logger.info(`Critical caches warmed for company: ${companyId}`);
        } catch (error: any) {
            logger.error(`Error warming caches for company: ${companyId}`, { error: error.message });
        }
    }

    /**
     * Warm caches for all active and recently active companies
     * For the first version, we warm the most recently created 10 companies
     */
    async warmAllActiveCompanies() {
        logger.info('🚀 Starting cache warming process...');
        const startTime = Date.now();

        try {
            const companies = await prisma.companies.findMany({
                where: { deleted_at: null },
                select: { id: true },
                orderBy: { created_at: 'desc' },
                take: 20, // Limit to top 20 for warming
            });

            logger.info(`Found ${companies.length} active companies to warm.`);

            // Warm sequentially or in small batches to avoid overloading DB
            for (const company of companies) {
                await this.warmCompanyCache(company.id);
            }

            const duration = Date.now() - startTime;
            logger.info(`✅ Cache warming completed in ${duration}ms`);
        } catch (error: any) {
            logger.error('Cache warming process failed', { error: error.message });
        }
    }
}

export default new CacheWarmingService();
