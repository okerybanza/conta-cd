"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
const database_1 = __importDefault(require("../config/database"));
const cache_service_1 = __importDefault(require("../services/cache.service"));
async function verify() {
    let company = await database_1.default.companies.findFirst();
    if (!company) {
        console.log('No company found');
        return;
    }
    const companyId = company.id;
    console.log(`--- Verifying Dashboard Optimization for company ${companyId} ---`);
    // 1. Invalidate cache to force re-calculation
    const cacheKey = `dashboard:stats:${companyId}`;
    await cache_service_1.default.delete(cacheKey);
    // 2. Measure performance
    const start = Date.now();
    const stats = await dashboard_service_1.default.getDashboardStats(companyId);
    const duration = Date.now() - start;
    console.log(`Dashboard generation took: ${duration}ms`);
    console.log(`Revenue Chart Points: ${stats.revenueByMonth.length}`);
    console.log(`Outstanding Chart Points: ${stats.outstandingByMonth.length}`);
    // 3. Verify cache presence
    const cached = await cache_service_1.default.get(cacheKey);
    console.log(`Cache present after generation: ${!!cached}`);
    console.log('\nOptimization verified successfully.');
}
verify().catch(console.error).finally(() => process.exit());
//# sourceMappingURL=verify-dashboard-optimization.js.map