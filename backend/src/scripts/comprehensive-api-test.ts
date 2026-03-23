import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';
let authToken = '';
let companyId = '';

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL';
    message: string;
    duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
    const start = Date.now();
    try {
        await testFn();
        results.push({
            name,
            status: 'PASS',
            message: 'Success',
            duration: Date.now() - start
        });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({
            name,
            status: 'FAIL',
            message: error.message || String(error),
            duration: Date.now() - start
        });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

async function testLogin() {
    const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'okerybanza@gmail.com',
        password: 'Test@2024'
    });

    if (!response.data.success || !response.data.data.accessToken) {
        throw new Error('Login failed - no access token');
    }

    authToken = response.data.data.accessToken;
    companyId = response.data.data.user.companyId;
    console.log(`   Token obtained, Company ID: ${companyId}`);
}

async function testGetProfile() {
    const response = await axios.get(`${API_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success || !response.data.data.email) {
        throw new Error('Profile fetch failed');
    }
    console.log(`   User: ${response.data.data.email}`);
}

async function testGetInvoices() {
    const response = await axios.get(`${API_BASE}/invoices`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Invoices fetch failed');
    }
    console.log(`   Found ${response.data.data.length} invoices`);
}

async function testGetCustomers() {
    const response = await axios.get(`${API_BASE}/customers`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Customers fetch failed');
    }
    console.log(`   Found ${response.data.data.length} customers`);
}

async function testGetProducts() {
    const response = await axios.get(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Products fetch failed');
    }
    console.log(`   Found ${response.data.data.length} products`);
}

async function testGetExpenses() {
    const response = await axios.get(`${API_BASE}/expenses`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Expenses fetch failed');
    }
    console.log(`   Found ${response.data.data.length} expenses`);
}

async function testGetAccounts() {
    const response = await axios.get(`${API_BASE}/accounts`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Accounts fetch failed');
    }
    console.log(`   Found ${response.data.data.length} chart of accounts`);
}

async function testGetTrialBalance() {
    const response = await axios.get(`${API_BASE}/accounting-reports/trial-balance`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        }
    });

    if (!response.data.success) {
        throw new Error('Trial Balance fetch failed');
    }
    console.log(`   Trial Balance has ${response.data.data.accounts?.length || 0} accounts`);
}

async function testGetDashboard() {
    const response = await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Dashboard stats fetch failed');
    }
    console.log(`   Dashboard loaded with stats`);
}

async function testGetStockMovements() {
    const response = await axios.get(`${API_BASE}/stock-movements`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Stock movements fetch failed');
    }
    console.log(`   Found ${response.data.data.length} stock movements`);
}

async function testGetJournalEntries() {
    const response = await axios.get(`${API_BASE}/journal-entries`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!response.data.success) {
        throw new Error('Journal entries fetch failed');
    }
    console.log(`   Found ${response.data.data.length} journal entries`);
}

async function main() {
    console.log('\n🚀 COMPREHENSIVE API TEST SUITE\n');
    console.log('Testing Production Backend at:', API_BASE);
    console.log('='.repeat(60));

    await runTest('1. Login Authentication', testLogin);
    await runTest('2. Get User Profile', testGetProfile);
    await runTest('3. Get Invoices List', testGetInvoices);
    await runTest('4. Get Customers List', testGetCustomers);
    await runTest('5. Get Products List', testGetProducts);
    await runTest('6. Get Expenses List', testGetExpenses);
    await runTest('7. Get Chart of Accounts', testGetAccounts);
    await runTest('8. Get Trial Balance Report', testGetTrialBalance);
    await runTest('9. Get Dashboard Stats', testGetDashboard);
    await runTest('10. Get Stock Movements', testGetStockMovements);
    await runTest('11. Get Journal Entries', testGetJournalEntries);

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    console.log('\n' + (failed === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));

    process.exit(failed > 0 ? 1 : 0);
}

main();
