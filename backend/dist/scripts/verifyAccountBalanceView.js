"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const account_service_1 = require("../services/account.service");
const database_1 = __importDefault(require("../config/database"));
const balanceValidation_service_1 = __importDefault(require("../services/balanceValidation.service"));
const accountService = new account_service_1.AccountService();
async function verifyOptimization() {
    console.log('--- Account Balance Optimization Verification ---');
    const companies = await database_1.default.companies.findMany({ take: 3 });
    if (companies.length === 0) {
        console.log('No companies found.');
        return;
    }
    for (const company of companies) {
        console.log(`\nTesting Company: ${company.name} (${company.id})`);
        const accounts = await database_1.default.accounts.findMany({
            where: { company_id: company.id },
            take: 5
        });
        for (const account of accounts) {
            console.log(`  Account: ${account.code} - ${account.name}`);
            // 1. Measure Manual Calculation (Legacy)
            const startManual = performance.now();
            const manualBalance = await balanceValidation_service_1.default.calculateBalanceFromEntries(company.id, account.id);
            const endManual = performance.now();
            const manualTime = endManual - startManual;
            // 2. Measure View Calculation (Optimized)
            const startView = performance.now();
            const viewBalance = await accountService.getBalance(company.id, account.id);
            const endView = performance.now();
            const viewTime = endView - startView;
            console.log(`    Manual: ${manualBalance.toFixed(2)} (${manualTime.toFixed(4)}ms)`);
            console.log(`    View:   ${viewBalance.toFixed(2)} (${viewTime.toFixed(4)}ms)`);
            const diff = Math.abs(manualBalance - viewBalance);
            if (diff < 0.01) {
                console.log('    ✅ Match confirmed.');
            }
            else {
                console.log(`    ❌ DISCREPANCY: ${diff.toFixed(2)}`);
            }
            if (viewTime < manualTime) {
                const speedup = (manualTime / viewTime).toFixed(2);
                console.log(`    🚀 Speedup: ${speedup}x faster`);
            }
        }
    }
    console.log('\n--- Verification Complete ---');
}
verifyOptimization()
    .catch(console.error)
    .finally(() => database_1.default.$disconnect());
//# sourceMappingURL=verifyAccountBalanceView.js.map