import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import accountService from '../../services/account.service';
import balanceValidationService from '../../services/balanceValidation.service';
import journalEntryService from '../../services/journalEntry.service';
import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * SPRINT 1 - TASK 1.2: Account Balance Calculation Tests
 * 
 * Critical tests to validate calculated balances
 */
describe('Account Balance Calculation (Task 1.2)', () => {
    let testCompanyId: string;
    let testAccountId: string;
    let testUserId: string;

    beforeAll(async () => {
        // Create test company
        const company = await prisma.companies.create({
            data: {
                id: `test_company_balance_${Date.now()}`,
                name: 'Test Company Balance',
                email: `test_balance_${Date.now()}@example.com`,
                updated_at: new Date(),
            },
        });
        testCompanyId = company.id;

        // Create test user
        const user = await prisma.users.create({
            data: {
                id: `test_user_balance_${Date.now()}`,
                email: `test_balance_user_${Date.now()}@example.com`,
                first_name: 'Test',
                last_name: 'Balance',
                password_hash: 'dummy',
                role: 'user',
                company_id: testCompanyId,
                updated_at: new Date(),
            },
        });
        testUserId = user.id;

        // Create test account
        const account = await prisma.accounts.create({
            data: {
                id: `test_account_${Date.now()}`,
                company_id: testCompanyId,
                code: '411TEST',
                name: 'Test Client Account',
                type: 'asset',
                balance: 0,
                updated_at: new Date(),
            },
        });
        testAccountId = account.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.journal_entry_lines.deleteMany({
            where: {
                accounts: { company_id: testCompanyId },
            },
        });
        await prisma.journal_entries.deleteMany({ where: { company_id: testCompanyId } });
        await prisma.accounts.deleteMany({ where: { company_id: testCompanyId } });
        await prisma.users.deleteMany({ where: { company_id: testCompanyId } });
        await prisma.companies.delete({ where: { id: testCompanyId } });
    });

    it('should throw error when calling updateBalance (deprecated)', async () => {
        await expect(
            accountService.updateBalance(testAccountId, 100)
        ).rejects.toThrow('BALANCE_UPDATE_NOT_ALLOWED');
    });

    it('should calculate balance from journal entries', async () => {
        // Create revenue account for the entry
        const revenueAccount = await prisma.accounts.create({
            data: {
                id: `test_revenue_${Date.now()}`,
                company_id: testCompanyId,
                code: '701TEST',
                name: 'Test Revenue',
                type: 'revenue',
                balance: 0,
                updated_at: new Date(),
            },
        });

        // Create a journal entry
        const entry = await journalEntryService.create(testCompanyId, {
            entryDate: new Date(),
            description: 'Test Entry',
            sourceType: 'manual',
            lines: [
                {
                    accountId: testAccountId,
                    description: 'Debit test',
                    debit: 500,
                    credit: 0,
                },
                {
                    accountId: revenueAccount.id,
                    description: 'Credit test',
                    debit: 0,
                    credit: 500,
                },
            ],
            createdBy: testUserId,
        });

        // Post the entry
        await journalEntryService.post(testCompanyId, entry.id);

        // Calculate balance using getBalance
        const balance = await accountService.getBalance(testCompanyId, testAccountId);

        // For asset account: debit increases balance
        expect(balance).toBe(500);

        // Cleanup
        await prisma.accounts.delete({ where: { id: revenueAccount.id } });
    });

    it('should return same balance from calculateBalanceFromEntries', async () => {
        const balanceFromService = await accountService.getBalance(testCompanyId, testAccountId);
        const balanceFromValidation = await balanceValidationService.calculateBalanceFromEntries(
            testCompanyId,
            testAccountId
        );

        expect(balanceFromService).toBe(balanceFromValidation);
    });

    it('should calculate balance only from posted entries', async () => {
        // Create expense account
        const expenseAccount = await prisma.accounts.create({
            data: {
                id: `test_expense_${Date.now()}`,
                company_id: testCompanyId,
                code: '601TEST',
                name: 'Test Expense',
                type: 'expense',
                balance: 0,
                updated_at: new Date(),
            },
        });

        const balanceBefore = await accountService.getBalance(testCompanyId, testAccountId);

        // Create a draft entry (should NOT affect balance)
        await journalEntryService.create(testCompanyId, {
            entryDate: new Date(),
            description: 'Draft Entry (should not count)',
            sourceType: 'manual',
            lines: [
                {
                    accountId: testAccountId,
                    description: 'Draft debit',
                    debit: 1000,
                    credit: 0,
                },
                {
                    accountId: expenseAccount.id,
                    description: 'Draft credit',
                    debit: 0,
                    credit: 1000,
                },
            ],
            createdBy: testUserId,
        });

        const balanceAfter = await accountService.getBalance(testCompanyId, testAccountId);

        // Balance should NOT change (draft entries excluded)
        expect(balanceAfter).toBe(balanceBefore);

        // Cleanup
        await prisma.accounts.delete({ where: { id: expenseAccount.id } });
    });

    it('should calculate total balance including children', async () => {
        // Create parent account
        const parentAccount = await prisma.accounts.create({
            data: {
                id: `test_parent_${Date.now()}`,
                company_id: testCompanyId,
                code: '400TEST',
                name: 'Test Parent',
                type: 'liability',
                balance: 0,
                updated_at: new Date(),
            },
        });

        // Create child account
        const childAccount = await prisma.accounts.create({
            data: {
                id: `test_child_${Date.now()}`,
                company_id: testCompanyId,
                code: '401TEST',
                name: 'Test Child',
                type: 'liability',
                parent_id: parentAccount.id,
                balance: 0,
                updated_at: new Date(),
            },
        });

        // Create asset account for entries
        const assetAccount = await prisma.accounts.create({
            data: {
                id: `test_asset_${Date.now()}`,
                company_id: testCompanyId,
                code: '510TEST',
                name: 'Test Asset',
                type: 'asset',
                balance: 0,
                updated_at: new Date(),
            },
        });

        // Add entry to parent
        const parentEntry = await journalEntryService.create(testCompanyId, {
            entryDate: new Date(),
            description: 'Parent Entry',
            sourceType: 'manual',
            lines: [
                { accountId: assetAccount.id, debit: 300, credit: 0 },
                { accountId: parentAccount.id, debit: 0, credit: 300 },
            ],
            createdBy: testUserId,
        });
        await journalEntryService.post(testCompanyId, parentEntry.id);

        // Add entry to child
        const childEntry = await journalEntryService.create(testCompanyId, {
            entryDate: new Date(),
            description: 'Child Entry',
            sourceType: 'manual',
            lines: [
                { accountId: assetAccount.id, debit: 200, credit: 0 },
                { accountId: childAccount.id, debit: 0, credit: 200 },
            ],
            createdBy: testUserId,
        });
        await journalEntryService.post(testCompanyId, childEntry.id);

        // Get total balance (should include child)
        const totalBalance = await accountService.getTotalBalance(testCompanyId, parentAccount.id);

        // For liability: credit increases, total = 300 + 200 = 500
        expect(totalBalance).toBe(500);

        // Cleanup
        await prisma.accounts.delete({ where: { id: childAccount.id } });
        await prisma.accounts.delete({ where: { id: parentAccount.id } });
        await prisma.accounts.delete({ where: { id: assetAccount.id } });
    });
});
