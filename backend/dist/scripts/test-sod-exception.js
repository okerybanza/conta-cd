"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const segregationOfDuties_service_1 = __importDefault(require("../services/segregationOfDuties.service"));
async function testSoD() {
    console.log('--- Testing Segregation of Duties Exception ---');
    // 1. Create a test company with 1 user
    const companyId = 'test-sod-' + Date.now();
    const userId = 'user-sod-' + Date.now();
    await database_1.default.companies.create({
        data: {
            id: companyId,
            name: 'SoD Test Single User',
            email: companyId + '@test.com',
            updated_at: new Date(),
        }
    });
    await database_1.default.users.create({
        data: {
            id: userId,
            company_id: companyId,
            email: userId + '@test.com',
            password_hash: 'hash',
            updated_at: new Date(),
        }
    });
    // 1.5 Create a fiscal period (required by trigger)
    await database_1.default.fiscal_periods.create({
        data: {
            id: 'fp-sod-' + Date.now(),
            company_id: companyId,
            name: 'FY 2026',
            start_date: new Date('2026-01-01'),
            end_date: new Date('2026-12-31'),
            status: 'open',
            updated_at: new Date(),
        }
    });
    // 1.7 Create a customer (required for invoice)
    const customerId = 'cust-sod-' + Date.now();
    await database_1.default.customers.create({
        data: {
            id: customerId,
            company_id: companyId,
            first_name: 'Test',
            last_name: 'Customer',
            email: customerId + '@test.com',
            updated_at: new Date(),
        }
    });
    // 2. Create a test invoice created by this user
    const invoiceId = 'inv-sod-' + Date.now();
    await database_1.default.invoices.create({
        data: {
            id: invoiceId,
            company_id: companyId,
            customer_id: customerId,
            invoice_number: 'SOD-001',
            invoice_date: new Date(),
            due_date: new Date(),
            status: 'draft',
            created_by: userId,
            updated_at: new Date(),
        }
    });
    console.log('Testing single-user company (Expect SUCCESS)...');
    try {
        await segregationOfDuties_service_1.default.validateNotSelfApproving(companyId, userId, 'invoice', invoiceId);
        console.log('✅ PASS: Exception applied correctly for single-user company.');
    }
    catch (e) {
        console.log('❌ FAIL: Exception NOT applied.', e.message);
    }
    // 3. Add another user to the company
    const secondUserId = 'user2-sod-' + Date.now();
    await database_1.default.users.create({
        data: {
            id: secondUserId,
            company_id: companyId,
            email: secondUserId + '@test.com',
            password_hash: 'hash',
            updated_at: new Date(),
        }
    });
    console.log('Testing multi-user company (Expect FAILURE)...');
    try {
        await segregationOfDuties_service_1.default.validateNotSelfApproving(companyId, userId, 'invoice', invoiceId);
        console.log('❌ FAIL: Self-approval NOT blocked for multi-user company.');
    }
    catch (e) {
        console.log('✅ PASS: Self-approval correctly blocked.', e.message);
    }
    // Cleanup (optional but good)
    console.log('Cleaning up...');
    await database_1.default.invoices.delete({ where: { id: invoiceId } });
    await database_1.default.users.deleteMany({ where: { company_id: companyId } });
    await database_1.default.companies.delete({ where: { id: companyId } });
    console.log('--- Test Complete ---');
}
testSoD().catch(console.error).finally(() => database_1.default.$disconnect());
//# sourceMappingURL=test-sod-exception.js.map