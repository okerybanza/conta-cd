import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:3001/api/v1';
let authToken = '';
let companyId = '';

interface TestResult {
    workflow: string;
    status: 'PASS' | 'FAIL';
    message: string;
    duration: number;
}

const results: TestResult[] = [];

async function runWorkflow(name: string, workflowFn: () => Promise<void>) {
    const start = Date.now();
    try {
        await workflowFn();
        results.push({
            workflow: name,
            status: 'PASS',
            message: 'Success',
            duration: Date.now() - start
        });
        console.log(`✅ ${name} - ${Date.now() - start}ms`);
    } catch (error: any) {
        results.push({
            workflow: name,
            status: 'FAIL',
            message: error.message || String(error),
            duration: Date.now() - start
        });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// Helper function to make authenticated requests
const api = {
    get: (url: string) => axios.get(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${authToken}` }
    }),
    post: (url: string, data: any) => axios.post(`${API_BASE}${url}`, data, {
        headers: { Authorization: `Bearer ${authToken}` }
    }),
    put: (url: string, data: any) => axios.put(`${API_BASE}${url}`, data, {
        headers: { Authorization: `Bearer ${authToken}` }
    }),
    delete: (url: string) => axios.delete(`${API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${authToken}` }
    })
};

// ==================== WORKFLOW 1: Authentication ====================
async function workflow_Authentication() {
    console.log('\n📝 Testing Authentication Workflow...');

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'okerybanza@gmail.com',
        password: 'Test@2024'
    });

    if (!loginResponse.data.success || !loginResponse.data.data.accessToken) {
        throw new Error('Login failed - no access token');
    }

    authToken = loginResponse.data.data.accessToken;
    companyId = loginResponse.data.data.user.companyId;
    console.log(`   ✓ Login successful`);
    console.log(`   ✓ Token obtained`);
    console.log(`   ✓ Company ID: ${companyId}`);

    // Get user profile
    const profileResponse = await api.get('/user/me');
    if (!profileResponse.data.success) {
        throw new Error('Profile fetch failed');
    }
    console.log(`   ✓ Profile retrieved: ${profileResponse.data.data.email}`);
}

// ==================== WORKFLOW 2: Customer Management ====================
async function workflow_CustomerManagement() {
    console.log('\n👥 Testing Customer Management Workflow...');

    let customerId: string;

    // Create customer
    const createResponse = await api.post('/customers', {
        type: 'entreprise',
        businessName: `Test Customer ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: '+243999999999',
        address: '123 Test Street',
        city: 'Kinshasa',
        country: 'RDC'
    });

    if (!createResponse.data.success) {
        throw new Error('Customer creation failed');
    }
    customerId = createResponse.data.data.id;
    console.log(`   ✓ Customer created: ${customerId}`);

    // Get customer list
    const listResponse = await api.get('/customers');
    if (!listResponse.data.success || listResponse.data.data.length === 0) {
        throw new Error('Customer list fetch failed');
    }
    console.log(`   ✓ Customer list retrieved: ${listResponse.data.data.length} customers`);

    // Get customer by ID
    const getResponse = await api.get(`/customers/${customerId}`);
    if (!getResponse.data.success) {
        throw new Error('Customer fetch by ID failed');
    }
    console.log(`   ✓ Customer retrieved by ID`);

    // Update customer
    const updateResponse = await api.put(`/customers/${customerId}`, {
        businessName: `Updated Customer ${Date.now()}`
    });
    if (!updateResponse.data.success) {
        throw new Error('Customer update failed');
    }
    console.log(`   ✓ Customer updated`);
}

// ==================== WORKFLOW 3: Product & Inventory ====================
async function workflow_ProductInventory() {
    console.log('\n📦 Testing Product & Inventory Workflow...');

    // Get products list
    const productsResponse = await api.get('/products');
    if (!productsResponse.data.success) {
        throw new Error('Products list fetch failed');
    }
    console.log(`   ✓ Products retrieved: ${productsResponse.data.data.length} products`);

    // Get warehouses
    const warehousesResponse = await api.get('/warehouses');
    if (!warehousesResponse.data.success) {
        throw new Error('Warehouses fetch failed');
    }
    console.log(`   ✓ Warehouses retrieved: ${warehousesResponse.data.data.length} warehouses`);

    // Get stock movements
    const movementsResponse = await api.get('/stock-movements');
    if (!movementsResponse.data.success) {
        throw new Error('Stock movements fetch failed');
    }
    console.log(`   ✓ Stock movements retrieved: ${movementsResponse.data.data.length} movements`);
}

// ==================== WORKFLOW 4: Invoice Management ====================
async function workflow_InvoiceManagement() {
    console.log('\n🧾 Testing Invoice Management Workflow...');

    // Get invoices list
    const listResponse = await api.get('/invoices');
    if (!listResponse.data.success) {
        throw new Error('Invoices list fetch failed');
    }
    console.log(`   ✓ Invoices retrieved: ${listResponse.data.data.length} invoices`);

    // If there are invoices, get the first one
    if (listResponse.data.data.length > 0) {
        const invoiceId = listResponse.data.data[0].id;
        const getResponse = await api.get(`/invoices/${invoiceId}`);
        if (!getResponse.data.success) {
            throw new Error('Invoice fetch by ID failed');
        }
        console.log(`   ✓ Invoice retrieved by ID: ${getResponse.data.data.invoiceNumber}`);
    }
}

// ==================== WORKFLOW 5: Expense Management ====================
async function workflow_ExpenseManagement() {
    console.log('\n💰 Testing Expense Management Workflow...');

    // Get expenses list
    const expensesResponse = await api.get('/expenses');
    if (!expensesResponse.data.success) {
        throw new Error('Expenses list fetch failed');
    }
    console.log(`   ✓ Expenses retrieved: ${expensesResponse.data.data.length} expenses`);

    // Get suppliers
    const suppliersResponse = await api.get('/suppliers');
    if (!suppliersResponse.data.success) {
        throw new Error('Suppliers fetch failed');
    }
    console.log(`   ✓ Suppliers retrieved: ${suppliersResponse.data.data.length} suppliers`);

    // Get expense categories
    const categoriesResponse = await api.get('/expense-categories');
    if (!categoriesResponse.data.success) {
        throw new Error('Expense categories fetch failed');
    }
    console.log(`   ✓ Expense categories retrieved: ${categoriesResponse.data.data.length} categories`);
}

// ==================== WORKFLOW 6: Accounting & Reports ====================
async function workflow_AccountingReports() {
    console.log('\n📊 Testing Accounting & Reports Workflow...');

    // Get chart of accounts
    const accountsResponse = await api.get('/accounts');
    if (!accountsResponse.data.success) {
        throw new Error('Chart of accounts fetch failed');
    }
    console.log(`   ✓ Chart of accounts retrieved: ${accountsResponse.data.data.length} accounts`);

    // Get journal entries
    const entriesResponse = await api.get('/journal-entries');
    if (!entriesResponse.data.success) {
        throw new Error('Journal entries fetch failed');
    }
    console.log(`   ✓ Journal entries retrieved: ${entriesResponse.data.data.length} entries`);

    // Get Trial Balance (with optimized batch query)
    const trialBalanceResponse = await api.get('/accounting-reports/trial-balance?startDate=2024-01-01&endDate=2024-12-31');
    if (!trialBalanceResponse.data.success) {
        throw new Error('Trial Balance fetch failed');
    }
    console.log(`   ✓ Trial Balance generated: ${trialBalanceResponse.data.data.accounts?.length || 0} accounts`);

    // Get Sales Journal
    const salesJournalResponse = await api.get('/accounting-reports/sales-journal?startDate=2024-01-01&endDate=2024-12-31');
    if (!salesJournalResponse.data.success) {
        throw new Error('Sales Journal fetch failed');
    }
    console.log(`   ✓ Sales Journal generated: ${salesJournalResponse.data.data.entries?.length || 0} entries`);

    // Get Purchase Journal
    const purchaseJournalResponse = await api.get('/accounting-reports/purchase-journal?startDate=2024-01-01&endDate=2024-12-31');
    if (!purchaseJournalResponse.data.success) {
        throw new Error('Purchase Journal fetch failed');
    }
    console.log(`   ✓ Purchase Journal generated: ${purchaseJournalResponse.data.data.entries?.length || 0} entries`);
}

// ==================== WORKFLOW 7: Dashboard & Analytics ====================
async function workflow_DashboardAnalytics() {
    console.log('\n📈 Testing Dashboard & Analytics Workflow...');

    // Get dashboard stats
    const statsResponse = await api.get('/dashboard/stats');
    if (!statsResponse.data.success) {
        throw new Error('Dashboard stats fetch failed');
    }
    console.log(`   ✓ Dashboard stats retrieved`);

    // Get dashboard charts
    const chartsResponse = await api.get('/dashboard/charts');
    if (!chartsResponse.data.success) {
        throw new Error('Dashboard charts fetch failed');
    }
    console.log(`   ✓ Dashboard charts retrieved`);
}

// ==================== WORKFLOW 8: Payment Management ====================
async function workflow_PaymentManagement() {
    console.log('\n💳 Testing Payment Management Workflow...');

    // Get payments list
    const paymentsResponse = await api.get('/payments');
    if (!paymentsResponse.data.success) {
        throw new Error('Payments list fetch failed');
    }
    console.log(`   ✓ Payments retrieved: ${paymentsResponse.data.data.length} payments`);
}

// ==================== WORKFLOW 9: HR Module ====================
async function workflow_HRModule() {
    console.log('\n👔 Testing HR Module Workflow...');

    // Get employees
    const employeesResponse = await api.get('/employees');
    if (!employeesResponse.data.success) {
        throw new Error('Employees fetch failed');
    }
    console.log(`   ✓ Employees retrieved: ${employeesResponse.data.data.length} employees`);

    // Get payroll
    const payrollResponse = await api.get('/payroll');
    if (!payrollResponse.data.success) {
        throw new Error('Payroll fetch failed');
    }
    console.log(`   ✓ Payroll retrieved: ${payrollResponse.data.data.length} payroll entries`);
}

// ==================== MAIN TEST RUNNER ====================
async function main() {
    console.log('\n🚀 COMPREHENSIVE AUTOMATED WORKFLOW TESTS');
    console.log('=========================================');
    console.log('Testing Production Backend at:', API_BASE);
    console.log('=========================================\n');

    await runWorkflow('1. Authentication & Authorization', workflow_Authentication);
    await runWorkflow('2. Customer Management', workflow_CustomerManagement);
    await runWorkflow('3. Product & Inventory', workflow_ProductInventory);
    await runWorkflow('4. Invoice Management', workflow_InvoiceManagement);
    await runWorkflow('5. Expense Management', workflow_ExpenseManagement);
    await runWorkflow('6. Accounting & Reports', workflow_AccountingReports);
    await runWorkflow('7. Dashboard & Analytics', workflow_DashboardAnalytics);
    await runWorkflow('8. Payment Management', workflow_PaymentManagement);
    await runWorkflow('9. HR Module', workflow_HRModule);

    console.log('\n' + '='.repeat(60));
    console.log('📊 WORKFLOW TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Workflows: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n❌ FAILED WORKFLOWS:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - ${r.workflow}: ${r.message}`);
        });
    }

    console.log('\n' + (failed === 0 ? '✅ ALL WORKFLOWS PASSED!' : '⚠️  SOME WORKFLOWS FAILED'));
    console.log('\nThe system is ready for manual browser testing.');

    process.exit(failed > 0 ? 1 : 0);
}

main();
