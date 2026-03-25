import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/auth.store';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
import LandingPage from './pages/landing/LandingPage';
const ContactPage = lazy(() => import('./pages/landing/ContactPage'));
const PlansPage = lazy(() => import('./pages/landing/PlansPage'));
import Layout from './components/layout/Layout';

// Lazy loading pour optimiser le bundle
const CustomersListPage = lazy(() => import('./pages/customers/CustomersListPage'));
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'));
const CustomerFormPage = lazy(() => import('./pages/customers/CustomerFormPage'));
const ProductsListPage = lazy(() => import('./pages/products/ProductsListPage'));
const ProductFormPage = lazy(() => import('./pages/products/ProductFormPage'));
const InvoicesListPage = lazy(() => import('./pages/invoices/InvoicesListPage'));
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'));
const InvoiceFormPage = lazy(() => import('./pages/invoices/InvoiceFormPage'));
const InvoicePreviewPage = lazy(() => import('./pages/invoices/InvoicePreviewPage'));
const QuotationsListPage = lazy(() => import('./pages/quotations/QuotationsListPage'));
const QuotationDetailPage = lazy(() => import('./pages/quotations/QuotationDetailPage'));
const QuotationFormPage = lazy(() => import('./pages/quotations/QuotationFormPage'));
const CreditNotesListPage = lazy(() => import('./pages/creditNotes/CreditNotesListPage'));
const CreditNoteDetailPage = lazy(() => import('./pages/creditNotes/CreditNoteDetailPage'));
const CreditNoteFormPage = lazy(() => import('./pages/creditNotes/CreditNoteFormPage'));
const RecurringInvoicesListPage = lazy(() => import('./pages/recurringInvoices/RecurringInvoicesListPage'));
const RecurringInvoiceFormPage = lazy(() => import('./pages/recurringInvoices/RecurringInvoiceFormPage'));
const ExpensesListPage = lazy(() => import('./pages/expenses/ExpensesListPage'));
const ExpenseDetailPage = lazy(() => import('./pages/expenses/ExpenseDetailPage'));
const ExpenseFormPage = lazy(() => import('./pages/expenses/ExpenseFormPage'));
const ExpenseApprovalPage = lazy(() => import('./pages/expenses/ExpenseApprovalPage'));
const SuppliersListPage = lazy(() => import('./pages/suppliers/SuppliersListPage'));
const SupplierFormPage = lazy(() => import('./pages/suppliers/SupplierFormPage'));
const SupplierDetailPage = lazy(() => import('./pages/suppliers/SupplierDetailPage'));
const AccountsListPage = lazy(() => import('./pages/accounts/AccountsListPage'));
const AccountDetailPage = lazy(() => import('./pages/accounts/AccountDetailPage'));
const AccountFormPage = lazy(() => import('./pages/accounts/AccountFormPage'));
const JournalEntriesListPage = lazy(() => import('./pages/journalEntries/JournalEntriesListPage'));
const JournalEntryDetailPage = lazy(() => import('./pages/journalEntries/JournalEntryDetailPage'));
const JournalEntryFormPage = lazy(() => import('./pages/journalEntries/JournalEntryFormPage'));
const PaymentsListPage = lazy(() => import('./pages/payments/PaymentsListPage'));
const PaymentDetailPage = lazy(() => import('./pages/payments/PaymentDetailPage'));
const PaymentFormPage = lazy(() => import('./pages/payments/PaymentFormPage'));
const NotificationsListPage = lazy(() => import('./pages/notifications/NotificationsListPage'));
const NotificationsSettingsPage = lazy(() => import('./pages/settings/NotificationsSettingsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const CompanySettingsPage = lazy(() => import('./pages/settings/CompanySettingsPage'));
const UsersUnifiedPage = lazy(() => import('./pages/settings/UsersUnifiedPage'));
const SubscriptionPage = lazy(() => import('./pages/settings/SubscriptionPage'));
const UpgradePage = lazy(() => import('./pages/settings/UpgradePage'));
const AccountantsSearchPage = lazy(() => import('./pages/settings/AccountantsSearchPage'));
const AccountantPublicProfilePage = lazy(() => import('./pages/accountant/AccountantPublicProfilePage'));
const AccountantRequestsPage = lazy(() => import('./pages/accountant/AccountantRequestsPage'));
const AccountantCompaniesPage = lazy(() => import('./pages/accountant/AccountantCompaniesPage'));
const ContractEditorPage = lazy(() => import('./pages/contracts/ContractEditorPage'));
const AccountantProfilePage = lazy(() => import('./pages/accountant/AccountantProfilePage'));
const AccountantDashboardPage = lazy(() => import('./pages/accountant/AccountantDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage'));
const AdminCompaniesPage = lazy(() => import('./pages/admin/AdminCompaniesPage'));
const AdminCompanyDetailPage = lazy(() => import('./pages/admin/AdminCompanyDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAccountantsPage = lazy(() => import('./pages/admin/AdminAccountantsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const SelectPlanPage = lazy(() => import('./pages/onboarding/SelectPlanPage'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));
const AccountantSelectPlanPage = lazy(() => import('./pages/onboarding/AccountantSelectPlanPage'));
const PayPalReturnPage = lazy(() => import('./pages/payments/PayPalReturnPage'));
const VisapayReturnPage = lazy(() => import('./pages/payments/VisapayReturnPage'));
const VisapayCardCollectionPage = lazy(() => import('./pages/payments/VisapayCardCollectionPage'));
const ReportingPage = lazy(() => import('./pages/reporting/ReportingPage'));
const AccountingReportsPage = lazy(() => import('./pages/accountingReports/AccountingReportsPage'));
const FinancialStatementsPage = lazy(() => import('./pages/financialStatements/FinancialStatementsPage'));
const ReconciliationPage = lazy(() => import('./pages/reconciliation/ReconciliationPage'));
const BalanceValidationPage = lazy(() => import('./pages/balanceValidation/BalanceValidationPage'));
const AgedBalancePage = lazy(() => import('./pages/agedBalance/AgedBalancePage'));
const FiscalPeriodsPage = lazy(() => import('./pages/fiscalPeriods/FiscalPeriodsPage'));
const VATPage = lazy(() => import('./pages/tva/VATPage'));
const BankReconciliationPage = lazy(() => import('./pages/bankReconciliation/BankReconciliationPage'));
const FiscalExportPage = lazy(() => import('./pages/fiscalExport/FiscalExportPage'));
const DepreciationsPage = lazy(() => import('./pages/depreciations/DepreciationsPage'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage'));
const SupportPage = lazy(() => import('./pages/support/SupportPage'));
const StockMovementsListPage = lazy(() => import('./pages/stock/StockMovementsListPage'));
const WarehouseListPage = lazy(() => import('./pages/warehouses/WarehouseListPage'));
const WarehouseFormPage = lazy(() => import('./pages/warehouses/WarehouseFormPage'));
const EmployeesListPage = lazy(() => import('./pages/hr/EmployeesListPage'));
const EmployeeDetailPage = lazy(() => import('./pages/hr/EmployeeDetailPage'));
const EmployeeFormPage = lazy(() => import('./pages/hr/EmployeeFormPage'));
const AttendancePage = lazy(() => import('./pages/hr/AttendancePage'));
const AttendanceFormPage = lazy(() => import('./pages/hr/AttendanceFormPage'));
const PayrollPage = lazy(() => import('./pages/hr/PayrollPage'));
const PayrollFormPage = lazy(() => import('./pages/hr/PayrollFormPage'));
const LeaveRequestsPage = lazy(() => import('./pages/hr/LeaveRequestsPage'));
const LeaveBalancesPage = lazy(() => import('./pages/hr/LeaveBalancesPage'));
const HrCompliancePage = lazy(() => import('./pages/hr/HrCompliancePage'));
const StockMovementFormPage = lazy(() => import('./pages/stock/StockMovementFormPage'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));
const AdminBrandingPage = lazy(() => import('./pages/admin/AdminBrandingPage'));
const RecurringInvoiceDetailPage = lazy(() => import('./pages/recurringInvoices/RecurringInvoiceDetailPage'));
const ContractsListPage = lazy(() => import('./pages/contracts/ContractsListPage'));
const WarehouseDetailPage = lazy(() => import('./pages/warehouses/WarehouseDetailPage'));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Chargement...</p>
    </div>
  </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function LandingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  // Pour la landing page, on l'affiche toujours, mais on redirige si connecté
  if (isAuthenticated && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuthStore();
  const isAccountant = user?.isAccountant && !user?.companyId;
  const isAdmin = user?.isSuperAdmin || user?.isContaUser;

  // Les admins ne doivent jamais voir le dashboard client
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isAccountant) {
    return <AccountantDashboardPage />;
  }

  return <DashboardPage />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const isAuthorized = user?.isSuperAdmin || user?.isContaUser;

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Suspense fallback={<LoadingFallback />}>
                <RegisterPage />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VerifyEmailPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ForgotPasswordPage />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ResetPasswordPage />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/onboarding/setup" element={<Suspense fallback={<div>Chargement...</div>}><OnboardingWizard /></Suspense>} />
          <Route path="/onboarding/select-plan"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <SelectPlanPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/onboarding/accountant/select-plan"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AccountantSelectPlanPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/visapay/card"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <VisapayCardCollectionPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardRouter />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPlansPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCompaniesPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/companies/:id"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCompanyDetailPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminUsersPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/accountants"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminAccountantsPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminAuditLogsPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPaymentsPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSettingsPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/branding"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminBrandingPage />
                  </Suspense>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomersListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProductsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProductDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProductFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ProductFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <InvoicesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <InvoiceFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <InvoiceDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/:id/preview"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <InvoicePreviewPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <InvoiceFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <QuotationsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <QuotationFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <QuotationDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <QuotationFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/credit-notes"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CreditNotesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/credit-notes/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CreditNoteFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/credit-notes/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CreditNoteDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/credit-notes/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CreditNoteFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ExpensesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ExpenseFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ExpenseDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ExpenseFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses/approvals"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ExpenseApprovalPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SuppliersListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SupplierFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SupplierFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SupplierDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/journal-entries"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <JournalEntriesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/journal-entries/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <JournalEntryFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/journal-entries/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <JournalEntryDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/journal-entries/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <JournalEntryFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recurring-invoices"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <RecurringInvoicesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recurring-invoices/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <RecurringInvoiceFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recurring-invoices/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <RecurringInvoiceFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/recurring-invoices/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <RecurringInvoiceDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/paypal/return"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PayPalReturnPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/visapay/return"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <VisapayReturnPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/visapay/collect"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <VisapayCardCollectionPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PaymentsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PaymentDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PaymentFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PaymentFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <NotificationsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <UserProfilePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/notifications"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <NotificationsSettingsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/company"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <CompanySettingsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/user"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <Navigate to="/settings/users" replace />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <UsersUnifiedPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/subscription"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SubscriptionPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/subscription/upgrade"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <UpgradePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/accountants/search"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountantsSearchPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accountants/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountantPublicProfilePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accountant/requests"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountantRequestsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accountant/companies"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountantCompaniesPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ContractsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/contracts/edit/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ContractEditorPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/contracts/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ContractEditorPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accountant/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountantProfilePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportingPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounting-reports"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountingReportsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/financial-statements"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <FinancialStatementsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <ReconciliationPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/balance-validation"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <BalanceValidationPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/aged-balance"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AgedBalancePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/fiscal-periods"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <FiscalPeriodsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/tva"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <VATPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/bank-reconciliation"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <BankReconciliationPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/fiscal-export"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <FiscalExportPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/depreciations"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <DepreciationsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AuditLogsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/support"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <SupportPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/employees"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <EmployeesListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/employees/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <EmployeeDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/employees/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <EmployeeFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/attendance"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AttendancePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/attendance/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <AttendanceFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/payroll"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PayrollPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/payroll/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <PayrollFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/employees/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <EmployeeFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/leave-requests"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <LeaveRequestsPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/leave-balances"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <LeaveBalancesPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/compliance"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <HrCompliancePage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/movements"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <StockMovementsListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/movements/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <StockMovementFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/warehouses"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <WarehouseListPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/warehouses/new"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <WarehouseFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/warehouses/:id/edit"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <WarehouseFormPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stock/warehouses/:id"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <WarehouseDetailPage />
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <LandingRoute>
              <LandingPage />
            </LandingRoute>
          }
        />
        <Route
          path="/home"
          element={
            <LandingRoute>
              <LandingPage />
            </LandingRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <LandingRoute>
              <ContactPage />
            </LandingRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <LandingRoute>
              <PlansPage />
            </LandingRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
