# 04_FRONTEND — Architecture Frontend

## Stack technique

| Élément | Version |
|---------|---------|
| Framework | React 18.2.0 |
| Build tool | Vite 5.0.8 |
| Langage | TypeScript 5.3.3 |
| Routing | React Router DOM 6.21.1 |
| State management | Zustand 4.4.7 |
| Formulaires | React Hook Form 7.49.2 + Yup 1.3.3 |
| HTTP client | Axios 1.6.2 |
| CSS | Tailwind CSS 3.3.6 |
| Composants UI | @headlessui/react 1.7.17 |
| Icônes | lucide-react 0.554.0 |
| Graphiques | Recharts 2.15.4 |
| Dates | date-fns 3.0.6 |

---

## State Management — Zustand

### `store/auth.store.ts`
Contient l'état global d'authentification. Référencé dans `App.tsx` via `useAuthStore()`.
Champs accessibles : `isAuthenticated`, `user` (dont `user.isAccountant`, `user.companyId`, `user.isSuperAdmin`, `user.isContaUser`).

### `store/theme.store.ts`
Contient l'état du thème UI. Utilisé par `components/theme/ThemeSelector.tsx`.

---

## Configuration API

| Élément | Valeur |
|---------|--------|
| Fichier config | `src/config/api.config.ts` |
| Client HTTP | `src/services/api.ts` (instance Axios globale) |
| URL par défaut (localhost) | `http://localhost:3001/api/v1` |
| URL prod (conta.cd en HTTPS) | `/api/v1` (chemin relatif, via nginx proxy) |
| URL prod (IP directe) | `http://185.250.37.250:3001/api/v1` |
| Détection automatique | Basée sur `window.location.hostname` |
| Variable d'env | `VITE_API_URL` (optionnel, prioritaire) |
| Timeout | 30 000 ms |
| Stockage tokens | `localStorage` (clés : `accessToken`, `refreshToken`) |
| Refresh automatique | Oui — intercepteur 401 → POST `/auth/refresh` → retry |
| Retry 429 | Oui — jusqu'à 3 tentatives, backoff exponentiel (1s, 2s, 4s) |

---

## Contextes React

| Fichier | Rôle |
|---------|------|
| `contexts/AuthContext.tsx` | Context d'authentification (wrappé sur Zustand) |
| `contexts/SubscriptionRequiredContext.tsx` | Gestion des gates d'abonnement |
| `contexts/ToastContext.tsx` | Notifications toast globales |

---

## Hooks personnalisés

| Hook | Fichier |
|------|---------|
| `useConfirm` | `hooks/useConfirm.ts` |
| `useLocationKey` | `hooks/useLocationKey.ts` |
| `useQuotaError` | `hooks/useQuotaError.ts` |
| `useToast` | `hooks/useToast.ts` |
| `useUserRole` | `hooks/useUserRole.ts` |

---

## Guards de routes

| Guard | Comportement |
|-------|-------------|
| `PrivateRoute` | Redirige vers `/login` si non authentifié |
| `PublicRoute` | Redirige vers `/dashboard` si authentifié |
| `LandingRoute` | Redirige `/` vers `/dashboard` si authentifié |
| `AdminRoute` | Redirige vers `/dashboard` si non `isSuperAdmin` ET non `isContaUser` |
| `DashboardRouter` | Redirige vers `/admin` si admin, sinon affiche dashboard selon rôle |

---

## Pages — Liste exhaustive (110 pages)

### Auth (5 pages)
| Route | Composant | Guard |
|-------|-----------|-------|
| `/login` | `pages/auth/LoginPage.tsx` | Aucun |
| `/register` | `pages/auth/RegisterPage.tsx` | PublicRoute |
| `/forgot-password` | `pages/auth/ForgotPasswordPage.tsx` | PublicRoute |
| `/reset-password` | `pages/auth/ResetPasswordPage.tsx` | PublicRoute |
| `/verify-email` | `pages/auth/VerifyEmailPage.tsx` | Aucun |

### Landing (3 pages)
| Route | Composant | Guard |
|-------|-----------|-------|
| `/` ou `/home` | `pages/landing/LandingPage.tsx` | LandingRoute |
| `/contact` | `pages/landing/ContactPage.tsx` | LandingRoute |
| `/plans` | `pages/landing/PlansPage.tsx` | LandingRoute |

### Onboarding (2 pages)
| Route | Composant | Guard |
|-------|-----------|-------|
| `/onboarding/select-plan` | `pages/onboarding/SelectPlanPage.tsx` | PrivateRoute |
| `/onboarding/accountant/select-plan` | `pages/onboarding/AccountantSelectPlanPage.tsx` | PrivateRoute |

### Dashboard (1 page)
| Route | Composant | Guard |
|-------|-----------|-------|
| `/dashboard` | `pages/dashboard/DashboardPage.tsx` (via DashboardRouter) | PrivateRoute |

### Clients (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/customers` | `CustomersListPage.tsx` |
| `/customers/new` | `CustomerFormPage.tsx` |
| `/customers/:id` | `CustomerDetailPage.tsx` |
| `/customers/:id/edit` | `CustomerFormPage.tsx` |

### Produits (3 routes → 2 composants)
| Route | Composant |
|-------|-----------|
| `/products` | `ProductsListPage.tsx` |
| `/products/new` | `ProductFormPage.tsx` |
| `/products/:id/edit` | `ProductFormPage.tsx` |

### Factures (5 routes → 4 composants)
| Route | Composant |
|-------|-----------|
| `/invoices` | `InvoicesListPage.tsx` |
| `/invoices/new` | `InvoiceFormPage.tsx` |
| `/invoices/:id` | `InvoiceDetailPage.tsx` |
| `/invoices/:id/preview` | `InvoicePreviewPage.tsx` (sans Layout) |
| `/invoices/:id/edit` | `InvoiceFormPage.tsx` |

### Devis (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/quotations` | `QuotationsListPage.tsx` |
| `/quotations/new` | `QuotationFormPage.tsx` |
| `/quotations/:id` | `QuotationDetailPage.tsx` |
| `/quotations/:id/edit` | `QuotationFormPage.tsx` |

### Avoirs (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/credit-notes` | `CreditNotesListPage.tsx` |
| `/credit-notes/new` | `CreditNoteFormPage.tsx` |
| `/credit-notes/:id` | `CreditNoteDetailPage.tsx` |
| `/credit-notes/:id/edit` | `CreditNoteFormPage.tsx` |

### Factures récurrentes (3 routes → 2 composants)
| Route | Composant |
|-------|-----------|
| `/recurring-invoices` | `RecurringInvoicesListPage.tsx` |
| `/recurring-invoices/new` | `RecurringInvoiceFormPage.tsx` |
| `/recurring-invoices/:id/edit` | `RecurringInvoiceFormPage.tsx` |

### Dépenses (5 routes + 1 approbation)
| Route | Composant |
|-------|-----------|
| `/expenses` | `ExpensesListPage.tsx` |
| `/expenses/new` | `ExpenseFormPage.tsx` |
| `/expenses/:id` | `ExpenseDetailPage.tsx` |
| `/expenses/:id/edit` | `ExpenseFormPage.tsx` |
| `/expenses/approvals` | `ExpenseApprovalPage.tsx` |

### Fournisseurs (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/suppliers` | `SuppliersListPage.tsx` |
| `/suppliers/new` | `SupplierFormPage.tsx` |
| `/suppliers/:id` | `SupplierDetailPage.tsx` |
| `/suppliers/:id/edit` | `SupplierFormPage.tsx` |

### Paiements (6 routes)
| Route | Composant |
|-------|-----------|
| `/payments` | `PaymentsListPage.tsx` |
| `/payments/new` | `PaymentFormPage.tsx` |
| `/payments/:id` | `PaymentDetailPage.tsx` |
| `/payments/:id/edit` | `PaymentFormPage.tsx` |
| `/payments/paypal/return` (×2 définitions) | `PayPalReturnPage.tsx` |
| `/payments/visapay/return` (×2 définitions) | `VisapayReturnPage.tsx` |
| `/payments/visapay/card` ou `/payments/visapay/collect` | `VisapayCardCollectionPage.tsx` |

### Plan comptable (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/accounts` | `AccountsListPage.tsx` |
| `/accounts/new` | `AccountFormPage.tsx` |
| `/accounts/:id` | `AccountDetailPage.tsx` |
| `/accounts/:id/edit` | `AccountFormPage.tsx` |

### Écritures comptables (4 routes → 3 composants)
| Route | Composant |
|-------|-----------|
| `/journal-entries` | `JournalEntriesListPage.tsx` |
| `/journal-entries/new` | `JournalEntryFormPage.tsx` |
| `/journal-entries/:id` | `JournalEntryDetailPage.tsx` |
| `/journal-entries/:id/edit` | `JournalEntryFormPage.tsx` |

### Rapports comptables et financiers (7 pages)
| Route | Composant |
|-------|-----------|
| `/reports` | `ReportingPage.tsx` |
| `/accounting-reports` | `AccountingReportsPage.tsx` |
| `/financial-statements` | `FinancialStatementsPage.tsx` |
| `/reconciliation` | `ReconciliationPage.tsx` |
| `/balance-validation` | `BalanceValidationPage.tsx` |
| `/aged-balance` | `AgedBalancePage.tsx` |
| `/bank-reconciliation` | `BankReconciliationPage.tsx` |

### Fiscal (3 pages)
| Route | Composant |
|-------|-----------|
| `/fiscal-periods` | `FiscalPeriodsPage.tsx` |
| `/tva` | `VATPage.tsx` |
| `/fiscal-export` | `FiscalExportPage.tsx` |

### Autres modules comptables (2 pages)
| Route | Composant |
|-------|-----------|
| `/depreciations` | `DepreciationsPage.tsx` |
| `/audit` | `AuditLogsPage.tsx` |

### Stock (3 routes)
| Route | Composant |
|-------|-----------|
| `/stock/movements` | `StockMovementsListPage.tsx` |
| `/stock/warehouses` | `WarehouseListPage.tsx` |
| `/stock/warehouses/new` | `WarehouseFormPage.tsx` |
| `/stock/warehouses/:id/edit` | `WarehouseFormPage.tsx` |

### RH (11 routes)
| Route | Composant |
|-------|-----------|
| `/hr/employees` | `EmployeesListPage.tsx` |
| `/hr/employees/new` (×2 définitions — voir ISSUES) | `EmployeesListPage.tsx` puis `EmployeeFormPage.tsx` |
| `/hr/employees/:id` | `EmployeeDetailPage.tsx` |
| `/hr/employees/:id/edit` | `EmployeeFormPage.tsx` |
| `/hr/attendance` | `AttendancePage.tsx` |
| `/hr/attendance/new` | `AttendanceFormPage.tsx` |
| `/hr/payroll` | `PayrollPage.tsx` |
| `/hr/payroll/new` | `PayrollFormPage.tsx` |
| `/hr/leave-requests` | `LeaveRequestsPage.tsx` |
| `/hr/leave-balances` | `LeaveBalancesPage.tsx` |
| `/hr/compliance` | `HrCompliancePage.tsx` |

### Expert-comptable (5 pages)
| Route | Composant |
|-------|-----------|
| `/accountant/profile` | `AccountantProfilePage.tsx` |
| `/accountant/requests` | `AccountantRequestsPage.tsx` |
| `/accountant/companies` | `AccountantCompaniesPage.tsx` |
| `/accountants/:id` | `AccountantPublicProfilePage.tsx` |
| `/contracts/new` | `ContractEditorPage.tsx` |
| `/contracts/edit/:id` | `ContractEditorPage.tsx` |

### Paramètres (6 routes)
| Route | Composant |
|-------|-----------|
| `/settings` | `SettingsPage.tsx` |
| `/settings/company` | `CompanySettingsPage.tsx` |
| `/settings/user` | Redirige vers `/settings/users` |
| `/settings/users` | `UsersUnifiedPage.tsx` |
| `/settings/notifications` | `NotificationsSettingsPage.tsx` |
| `/settings/subscription` | `SubscriptionPage.tsx` |
| `/settings/subscription/upgrade` | `UpgradePage.tsx` |
| `/settings/accountants/search` | `AccountantsSearchPage.tsx` |

### Administration (SuperAdmin) (8 routes)
| Route | Composant | Guard |
|-------|-----------|-------|
| `/admin` | `AdminDashboardPage.tsx` | AdminRoute |
| `/admin/plans` | `AdminPlansPage.tsx` | AdminRoute |
| `/admin/companies` | `AdminCompaniesPage.tsx` | AdminRoute |
| `/admin/companies/:id` | `AdminCompanyDetailPage.tsx` | AdminRoute |
| `/admin/users` | `AdminUsersPage.tsx` | AdminRoute |
| `/admin/accountants` | `AdminAccountantsPage.tsx` | AdminRoute |
| `/admin/settings` | `AdminSettingsPage.tsx` | AdminRoute |
| `/admin/audit-logs` | `AdminAuditLogsPage.tsx` | AdminRoute |
| `/admin/payments` | `AdminPaymentsPage.tsx` | AdminRoute |

### Divers (5 pages)
| Route | Composant |
|-------|-----------|
| `/notifications` | `NotificationsListPage.tsx` |
| `/profile` | `UserProfilePage.tsx` |
| `/support` | `SupportPage.tsx` |

---

## Services frontend — Liste exhaustive (50 fichiers)

| Fichier | Module correspondant |
|---------|---------------------|
| `api.ts` | Client Axios global |
| `account.service.ts` | Plan comptable |
| `accountant.service.ts` | Expert-comptable |
| `accountingReports.service.ts` | Rapports comptables |
| `admin.service.ts` | SuperAdmin |
| `agedBalance.service.ts` | Balance âgée |
| `attendance.service.ts` | Présences RH |
| `audit.service.ts` | Journalisation |
| `balanceValidation.service.ts` | Validation soldes |
| `bankReconciliation.service.ts` | Rapprochement bancaire |
| `branding.service.ts` | Personnalisation |
| `contract.service.ts` | Contrats |
| `creditNote.service.ts` | Avoirs |
| `customer.service.ts` | Clients |
| `dashboard.service.ts` | Dashboard |
| `depreciation.service.ts` | Amortissements |
| `employee.service.ts` | Employés |
| `employeeDocument.service.ts` | Documents employés |
| `expense.service.ts` | Dépenses |
| `expenseCategory.service.ts` | Catégories de dépenses |
| `financialStatements.service.ts` | États financiers |
| `fiscalExport.service.ts` | Export fiscal |
| `fiscalPeriod.service.ts` | Périodes fiscales |
| `hrCompliance.service.ts` | Conformité RH |
| `invoice.service.ts` | Factures |
| `journalEntry.service.ts` | Écritures comptables |
| `journalEntryValidation.service.ts` | Validation écritures |
| `leaveBalance.service.ts` | Soldes congés |
| `leavePolicy.service.ts` | Politiques congés |
| `leaveRequest.service.ts` | Demandes congés |
| `notification.service.ts` | Notifications |
| `package.service.ts` | Plans tarifaires |
| `payment.service.ts` | Paiements |
| `paypal.service.ts` | PayPal |
| `payroll.service.ts` | Paie |
| `product.service.ts` | Produits |
| `quota.service.ts` | Quotas |
| `quotation.service.ts` | Devis |
| `reconciliation.service.ts` | Lettrage |
| `recurringInvoice.service.ts` | Factures récurrentes |
| `reporting.service.ts` | Rapports |
| `search.service.ts` | Recherche globale |
| `settings.service.ts` | Paramètres |
| `stockMovement.service.ts` | Mouvements stock |
| `supplier.service.ts` | Fournisseurs |
| `support.service.ts` | Support |
| `syscohadaChartOfAccounts.service.ts` | Plan SYSCOHADA (aucun backend dédié) |
| `tva.service.ts` | TVA |
| `user.service.ts` | Utilisateurs |
| `visapay.service.ts` | VisaPay |
| `warehouse.service.ts` | Entrepôts |

---

## Composants globaux et UI

### Layout
| Composant | Rôle |
|-----------|------|
| `components/layout/Layout.tsx` | Wrapper principal (sidebar + header) |
| `components/layout/Sidebar.tsx` | Navigation latérale |
| `components/layout/Header.tsx` | Barre de navigation haute |

### Dashboard — Composants par rôle
| Composant | Rôle |
|-----------|------|
| `RoleBasedDashboard.tsx` | Dispatch selon le rôle utilisateur |
| `OwnerDashboard.tsx` | Tableau de bord propriétaire |
| `ManagerDashboard.tsx` | Tableau de bord manager |
| `EmployeeDashboard.tsx` | Tableau de bord employé |
| `RHDashboard.tsx` | Tableau de bord RH |
| `AccountantDashboard.tsx` | Tableau de bord expert-comptable (lié entreprise) |
| `ExpertComptableDashboard.tsx` | Tableau de bord expert-comptable (autonome) |
| `DefaultDashboard.tsx` | Tableau de bord par défaut |

### Composants UI réutilisables
| Composant | Rôle |
|-----------|------|
| `ui/ActionView.tsx` | Vue d'action générique |
| `ui/ConfirmDialog.tsx` | Dialogue de confirmation |
| `ui/ErrorMessage.tsx` | Affichage d'erreurs |
| `ui/FormInput.tsx` | Champ de formulaire générique |
| `ui/Modal.tsx` | Modal générique |
| `ui/ReadOnlyView.tsx` | Vue lecture seule |
| `ui/SlideIn.tsx` | Panneau latéral slide-in |
| `ui/StatusBadge.tsx` | Badge de statut |
| `ui/TemporalConsequences.tsx` | Affichage conséquences temporelles |
| `ui/Toast.tsx` / `ToastContainer.tsx` | Notifications toast |
| `shared/ActionsMenu.tsx` | Menu d'actions contextuel |
| `shared/SortableTable.tsx` | Tableau triable |
| `security/SessionTimeoutManager.tsx` | Gestion expiration de session |
| `FeatureLockOverlay.tsx` | Overlay de verrouillage de fonctionnalité |
| `PackageBadge.tsx` | Badge de plan d'abonnement |
| `QuotaErrorModal.tsx` | Modal d'erreur de quota |
| `UpgradeBanner.tsx` / `UpgradeCard.tsx` | Bannière et carte de mise à niveau |
| `theme/ThemeSelector.tsx` | Sélecteur de thème |
| `search/GlobalSearch.tsx` | Recherche globale |
