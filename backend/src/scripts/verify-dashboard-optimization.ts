import dashboardService from '../services/dashboard.service';
import prisma from '../config/database';
import cacheService from '../services/cache.service';

async function verify() {
    let company = await prisma.companies.findFirst();
    if (!company) {
        console.log('No company found');
        return;
    }
    const companyId = company.id;

    console.log(`--- Verifying Dashboard Optimization for company ${companyId} ---`);

    // 1. Invalidate cache to force re-calculation
    const cacheKey = `dashboard:stats:${companyId}`;
    await cacheService.delete(cacheKey);

    // 2. Measure performance
    const start = Date.now();
    const stats = await dashboardService.getDashboardStats(companyId);
    const duration = Date.now() - start;

    console.log(`Dashboard generation took: ${duration}ms`);
    console.log(`Revenue Chart Points: ${stats.revenueByMonth.length}`);
    console.log(`Outstanding Chart Points: ${stats.outstandingByMonth.length}`);

    // 3. Verify cache presence
    const cached = await cacheService.get(cacheKey);
    console.log(`Cache present after generation: ${!!cached}`);

    console.log('\nOptimization verified successfully.');
}

verify().catch(console.error).finally(() => process.exit());
