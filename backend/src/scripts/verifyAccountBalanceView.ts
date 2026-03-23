import { AccountService } from '../services/account.service';
import prisma from '../config/database';
import balanceValidationService from '../services/balanceValidation.service';

const accountService = new AccountService();

async function verifyOptimization() {
    console.log('--- Account Balance Optimization Verification ---');

    const companies = await prisma.companies.findMany({ take: 3 });

    if (companies.length === 0) {
        console.log('No companies found.');
        return;
    }

    for (const company of companies) {
        console.log(`\nTesting Company: ${company.name} (${company.id})`);

        const accounts = await prisma.accounts.findMany({
            where: { company_id: company.id },
            take: 5
        });

        for (const account of accounts) {
            console.log(`  Account: ${account.code} - ${account.name}`);

            // 1. Measure Manual Calculation (Legacy)
            const startManual = performance.now();
            const manualBalance = await balanceValidationService.calculateBalanceFromEntries(company.id, account.id);
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
            } else {
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
    .finally(() => prisma.$disconnect());
