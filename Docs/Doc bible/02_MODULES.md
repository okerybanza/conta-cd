# 02_MODULES — Inventaire des modules

## Convention des statuts
- **COMPLET** : controller + service + routes backend + page(s) frontend + service frontend présents
- **PARTIEL** : implémentation incomplète (TODOs structurels ou fonctionnalités manquantes documentées dans le code)
- **SQUELETTE** : fichiers présents mais logique non implémentée

---

## 1. Auth

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/auth.controller.ts` |
| Service | `backend/src/services/auth.service.ts`, `backend/src/services/auth/revocation.service.ts`, `backend/src/services/jwe-jws.service.ts` |
| Routes | `backend/src/routes/auth.routes.ts` |
| Pages frontend | `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx`, `pages/auth/ForgotPasswordPage.tsx`, `pages/auth/ResetPasswordPage.tsx`, `pages/auth/VerifyEmailPage.tsx` |
| Contextes frontend | `contexts/AuthContext.tsx`, `store/auth.store.ts` |
| Modèles Prisma | `users` |

**Endpoints API :**
| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/api/v1/auth/register` | Non |
| POST | `/api/v1/auth/login` | Non |
| POST | `/api/v1/auth/verify-email` | Non |
| POST | `/api/v1/auth/resend-verification` | Non |
| POST | `/api/v1/auth/refresh` | Non |
| POST | `/api/v1/auth/forgot-password` | Non |
| POST | `/api/v1/auth/reset-password` | Non |
| POST | `/api/v1/auth/logout` | Non |
| GET | `/api/v1/auth/dev/email-status` | Non |
| GET | `/api/v1/auth/me` | Oui |
| POST | `/api/v1/auth/2fa/enable` | Oui |
| POST | `/api/v1/auth/2fa/verify` | Oui |
| POST | `/api/v1/auth/2fa/disable` | Oui |

**Statut : COMPLET**

---

## 2. Customers (Clients)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/customer.controller.ts` |
| Service | `backend/src/services/customer.service.ts` |
| Routes | `backend/src/routes/customer.routes.ts` |
| Pages frontend | `pages/customers/CustomersListPage.tsx`, `CustomerDetailPage.tsx`, `CustomerFormPage.tsx` |
| Composants | `components/customers/CustomerDetailSlideIn.tsx`, `CustomerForm.tsx`, `CustomerFormSlideIn.tsx` |
| Service frontend | `services/customer.service.ts` |
| Modèles Prisma | `customers` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/customers` |
| GET | `/api/v1/customers` |
| GET | `/api/v1/customers/:id` |
| PUT | `/api/v1/customers/:id` |
| DELETE | `/api/v1/customers/:id` |

**Statut : COMPLET**

---

## 3. Products (Produits & Services)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/product.controller.ts` |
| Service | `backend/src/services/product.service.ts` |
| Routes | `backend/src/routes/product.routes.ts` |
| Pages frontend | `pages/products/ProductsListPage.tsx`, `ProductFormPage.tsx` |
| Service frontend | `services/product.service.ts` |
| Modèles Prisma | `products` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/products` |
| GET | `/api/v1/products` |
| GET | `/api/v1/products/:id` |
| PUT | `/api/v1/products/:id` |
| DELETE | `/api/v1/products/:id` |

**Statut : COMPLET**

---

## 4. Invoices (Factures)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/invoice.controller.ts` |
| Service | `backend/src/services/invoice.service.ts` + sous-services : `invoice/invoiceCore.service.ts`, `invoiceCreation.service.ts`, `invoiceUpdate.service.ts`, `invoiceDelete.service.ts`, `invoiceAccounting.service.ts`, `invoiceHelper.service.ts`, `invoiceWorkflow.service.ts`, `invoiceHistory.service.ts`, `invoiceValidation.service.ts` |
| Routes | `backend/src/routes/invoice.routes.ts` |
| Pages frontend | `pages/invoices/InvoicesListPage.tsx`, `InvoiceDetailPage.tsx`, `InvoiceFormPage.tsx`, `InvoicePreviewPage.tsx` |
| Composants | `components/invoices/InvoiceDetailSlideIn.tsx`, `InvoiceForm.tsx`, `InvoiceFormSlideIn.tsx`, `components/invoice/InvoiceTemplatePreview.tsx` |
| Service frontend | `services/invoice.service.ts` |
| Modèles Prisma | `invoices`, `invoice_lines` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/invoices` (idempotency middleware) |
| GET | `/api/v1/invoices` |
| GET | `/api/v1/invoices/:id` |
| PUT | `/api/v1/invoices/:id` |
| DELETE | `/api/v1/invoices/:id` |
| PATCH | `/api/v1/invoices/:id/status` |
| POST | `/api/v1/invoices/:id/duplicate` |
| GET | `/api/v1/invoices/:id/pdf` |
| GET | `/api/v1/invoices/:id/preview` |

**Templates de factures :** 24 templates HTML dans `backend/src/templates/invoices/`

**Statut : COMPLET**

---

## 5. Quotations (Devis)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/quotation.controller.ts` |
| Service | `backend/src/services/quotation.service.ts` |
| Routes | `backend/src/routes/quotation.routes.ts` |
| Pages frontend | `pages/quotations/QuotationsListPage.tsx`, `QuotationDetailPage.tsx`, `QuotationFormPage.tsx` |
| Service frontend | `services/quotation.service.ts` |
| Modèles Prisma | `quotations`, `quotation_lines` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/quotations` |
| GET | `/api/v1/quotations` |
| GET | `/api/v1/quotations/:id` |
| PUT | `/api/v1/quotations/:id` |
| DELETE | `/api/v1/quotations/:id` |

**Statut : COMPLET**

---

## 6. Credit Notes (Avoirs)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/creditNote.controller.ts` |
| Service | `backend/src/services/creditNote.service.ts` |
| Routes | `backend/src/routes/creditNote.routes.ts` |
| Pages frontend | `pages/creditNotes/CreditNotesListPage.tsx`, `CreditNoteDetailPage.tsx`, `CreditNoteFormPage.tsx` |
| Composants | `components/creditNotes/CreditNoteFormSlideIn.tsx` |
| Service frontend | `services/creditNote.service.ts` |
| Modèles Prisma | `credit_notes` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/credit-notes` |
| GET | `/api/v1/credit-notes` |
| GET | `/api/v1/credit-notes/:id` |
| PUT | `/api/v1/credit-notes/:id` |
| DELETE | `/api/v1/credit-notes/:id` |

**Statut : COMPLET**

---

## 7. Recurring Invoices (Factures récurrentes)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/recurringInvoice.controller.ts` |
| Service | `backend/src/services/recurringInvoice.service.ts` |
| Routes | `backend/src/routes/recurringInvoice.routes.ts` |
| Pages frontend | `pages/recurringInvoices/RecurringInvoicesListPage.tsx`, `RecurringInvoiceFormPage.tsx` |
| Service frontend | `services/recurringInvoice.service.ts` |
| Modèles Prisma | `recurring_invoices`, `recurring_invoice_lines` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/recurring-invoices` |
| GET | `/api/v1/recurring-invoices` |
| GET | `/api/v1/recurring-invoices/:id` |
| PUT | `/api/v1/recurring-invoices/:id` |
| DELETE | `/api/v1/recurring-invoices/:id` |

**Statut : COMPLET**

---

## 8. Payments (Paiements)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/payment.controller.ts` |
| Service | `backend/src/services/payment.service.ts`, `subscription-payment.service.ts` |
| Routes | `backend/src/routes/payment.routes.ts` |
| Pages frontend | `pages/payments/PaymentsListPage.tsx`, `PaymentDetailPage.tsx`, `PaymentFormPage.tsx`, `PayPalReturnPage.tsx`, `VisapayReturnPage.tsx`, `VisapayCardCollectionPage.tsx` |
| Composants | `components/payments/PaymentDetailSlideIn.tsx`, `PaymentFormSlideIn.tsx` |
| Service frontend | `services/payment.service.ts`, `services/paypal.service.ts`, `services/visapay.service.ts` |
| Modèles Prisma | `payments` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/payments` |
| GET | `/api/v1/payments` |
| GET | `/api/v1/payments/:id` |
| PUT | `/api/v1/payments/:id` |
| DELETE | `/api/v1/payments/:id` |

**Sous-module PayPal :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/paypal/init` |
| POST | `/api/v1/paypal/capture` |
| GET | `/api/v1/paypal/order/:orderId` |

**Statut : COMPLET**

---

## 9. Expenses (Dépenses)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/expense.controller.ts`, `expenseAttachment.controller.ts`, `expenseApproval.controller.ts`, `expenseCategory.controller.ts` |
| Service | `backend/src/services/expense.service.ts`, `expenseAttachment.service.ts`, `expenseApproval.service.ts`, `expenseApprovalRule.service.ts`, `expenseCategory.service.ts` |
| Routes | `backend/src/routes/expense.routes.ts` |
| Pages frontend | `pages/expenses/ExpensesListPage.tsx`, `ExpenseDetailPage.tsx`, `ExpenseFormPage.tsx`, `ExpenseApprovalPage.tsx` |
| Composants | `components/expenses/ExpenseApprovalPanel.tsx`, `ExpenseAttachmentUpload.tsx` |
| Service frontend | `services/expense.service.ts`, `services/expenseCategory.service.ts` |
| Modèles Prisma | `expenses`, `ExpenseAttachment`, `ExpenseApproval`, `ExpenseApprovalRule`, `expense_categories` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/expenses` |
| GET | `/api/v1/expenses` |
| GET | `/api/v1/expenses/:id` |
| PUT | `/api/v1/expenses/:id` |
| DELETE | `/api/v1/expenses/:id` |
| POST | `/api/v1/expenses/:id/duplicate` |
| POST | `/api/v1/expenses/:id/attachments` |
| GET | `/api/v1/expenses/:id/attachments` |
| GET | `/api/v1/expenses/:id/attachments/:filename` |
| DELETE | `/api/v1/expenses/:id/attachments/:attachmentId` |
| POST | `/api/v1/expenses/:id/approval/request` |
| GET | `/api/v1/expenses/:id/approvals` |
| GET | `/api/v1/expenses/approvals/pending` |
| GET | `/api/v1/expenses/approvals/:id` |
| POST | `/api/v1/expenses/approvals/:id/approve` |
| POST | `/api/v1/expenses/approvals/:id/reject` |
| POST | `/api/v1/expenses/approval-rules` |
| GET | `/api/v1/expenses/approval-rules` |
| GET | `/api/v1/expenses/approval-rules/:id` |
| PUT | `/api/v1/expenses/approval-rules/:id` |
| DELETE | `/api/v1/expenses/approval-rules/:id` |

**Statut : COMPLET**

---

## 10. Suppliers (Fournisseurs)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/supplier.controller.ts` |
| Service | `backend/src/services/supplier.service.ts` |
| Routes | `backend/src/routes/supplier.routes.ts` |
| Pages frontend | `pages/suppliers/SuppliersListPage.tsx`, `SupplierFormPage.tsx`, `SupplierDetailPage.tsx` |
| Service frontend | `services/supplier.service.ts` (NON DÉTERMINABLE depuis la liste — absent de la liste frontend/src/services/) |
| Modèles Prisma | `suppliers` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/suppliers` |
| GET | `/api/v1/suppliers` |
| GET | `/api/v1/suppliers/:id` |
| PUT | `/api/v1/suppliers/:id` |
| DELETE | `/api/v1/suppliers/:id` |

**Statut : COMPLET**

---

## 11. Accounts (Plan comptable)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/account.controller.ts` |
| Service | `backend/src/services/account.service.ts` |
| Routes | `backend/src/routes/account.routes.ts` |
| Pages frontend | `pages/accounts/AccountsListPage.tsx`, `AccountDetailPage.tsx`, `AccountFormPage.tsx` |
| Service frontend | `services/account.service.ts` |
| Modèles Prisma | `accounts`, `account_balances_view` (vue) |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/accounts` |
| GET | `/api/v1/accounts` |
| GET | `/api/v1/accounts/:id` |
| PUT | `/api/v1/accounts/:id` |
| DELETE | `/api/v1/accounts/:id` |

**Statut : COMPLET**

---

## 12. Journal Entries (Écritures comptables)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/journalEntry.controller.ts` |
| Service | `backend/src/services/journalEntry.service.ts` + `journalEntry/journalEntryCore.service.ts`, `journalEntryAutomation.service.ts`, `journalEntryHelper.service.ts`, `journalEntryWorkflow.service.ts` |
| Routes | `backend/src/routes/journalEntry.routes.ts` |
| Pages frontend | `pages/journalEntries/JournalEntriesListPage.tsx`, `JournalEntryDetailPage.tsx`, `JournalEntryFormPage.tsx` |
| Service frontend | `services/journalEntry.service.ts`, `services/journalEntryValidation.service.ts` |
| Modèles Prisma | `journal_entries`, `journal_entry_lines` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/journal-entries` |
| GET | `/api/v1/journal-entries` |
| GET | `/api/v1/journal-entries/:id` |
| PUT | `/api/v1/journal-entries/:id` |
| DELETE | `/api/v1/journal-entries/:id` |

**Statut : COMPLET**

---

## 13. Reporting

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/reporting.controller.ts` |
| Service | `backend/src/services/reporting.service.ts`, `reporting/multiCurrencyReport.service.ts` |
| Routes | `backend/src/routes/reporting.routes.ts` |
| Pages frontend | `pages/reporting/ReportingPage.tsx` |
| Service frontend | `services/reporting.service.ts` (NON DÉTERMINABLE depuis la liste) |
| Modèles Prisma | (agrège plusieurs modèles) |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| GET | `/api/v1/reporting/*` (détail des endpoints NON DÉTERMINABLE sans lecture du fichier de routes) |

**Statut : COMPLET**

---

## 14. Accounting Reports (Rapports comptables)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/accountingReports.controller.ts` |
| Service | `backend/src/services/accountingReports.service.ts` |
| Routes | `backend/src/routes/accountingReports.routes.ts` |
| Pages frontend | `pages/accountingReports/AccountingReportsPage.tsx` |
| Service frontend | `services/accountingReports.service.ts` |
| Modèles Prisma | (agrège `journal_entries`, `accounts`) |

**Statut : COMPLET**

---

## 15. Financial Statements (États financiers)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/financialStatements.controller.ts` |
| Service | `backend/src/services/financialStatements.service.ts` |
| Routes | `backend/src/routes/financialStatements.routes.ts` |
| Pages frontend | `pages/financialStatements/FinancialStatementsPage.tsx` |
| Composants | `components/financialStatements/BalanceSheet.tsx`, `CashFlowStatement.tsx`, `IncomeStatement.tsx` |
| Service frontend | `services/financialStatements.service.ts` |
| Modèles Prisma | (agrège `accounts`, `journal_entries`) |

**Statut : COMPLET**

---

## 16. Reconciliation (Lettrage)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/reconciliation.controller.ts` |
| Service | `backend/src/services/reconciliation.service.ts` |
| Routes | `backend/src/routes/reconciliation.routes.ts` |
| Pages frontend | `pages/reconciliation/ReconciliationPage.tsx` |
| Service frontend | `services/reconciliation.service.ts` |
| Modèles Prisma | `journal_entries`, `accounts` |

**Statut : COMPLET**

---

## 17. Bank Reconciliation (Rapprochement bancaire)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/bankReconciliation.controller.ts` |
| Service | `backend/src/services/bankReconciliation.service.ts` |
| Routes | `backend/src/routes/bankReconciliation.routes.ts` |
| Pages frontend | `pages/bankReconciliation/BankReconciliationPage.tsx` |
| Service frontend | `services/bankReconciliation.service.ts` |
| Modèles Prisma | `bank_statements`, `bank_transactions` |

**Statut : COMPLET**

---

## 18. Balance Validation (Validation soldes)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/balanceValidation.controller.ts` |
| Service | `backend/src/services/balanceValidation.service.ts` |
| Routes | `backend/src/routes/balanceValidation.routes.ts` |
| Pages frontend | `pages/balanceValidation/BalanceValidationPage.tsx` |
| Service frontend | `services/balanceValidation.service.ts` |
| Modèles Prisma | `accounts`, `journal_entries` |

**Statut : COMPLET**

---

## 19. Aged Balance (Balance âgée)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/agedBalance.controller.ts` |
| Service | `backend/src/services/agedBalance.service.ts` |
| Routes | `backend/src/routes/agedBalance.routes.ts` |
| Pages frontend | `pages/agedBalance/AgedBalancePage.tsx` |
| Service frontend | `services/agedBalance.service.ts` |
| Modèles Prisma | `invoices`, `payments`, `customers` |

**Statut : COMPLET**

---

## 20. Fiscal Periods (Périodes fiscales)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/fiscalPeriod.controller.ts` |
| Service | `backend/src/services/fiscalPeriod.service.ts` |
| Routes | `backend/src/routes/fiscalPeriod.routes.ts` |
| Pages frontend | `pages/fiscalPeriods/FiscalPeriodsPage.tsx` |
| Service frontend | `services/fiscalPeriod.service.ts` |
| Modèles Prisma | `fiscal_periods` |

**Statut : COMPLET**

---

## 21. TVA (Gestion de la TVA)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/tva.controller.ts` |
| Service | `backend/src/services/tva.service.ts` |
| Routes | `backend/src/routes/tva.routes.ts` |
| Pages frontend | `pages/tva/VATPage.tsx` |
| Service frontend | `services/tva.service.ts` |
| Modèles Prisma | `journal_entries`, `invoices` |

**Statut : COMPLET**

---

## 22. Fiscal Export (Export fiscal)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/fiscalExport.controller.ts` |
| Service | `backend/src/services/fiscalExport.service.ts` |
| Routes | `backend/src/routes/fiscalExport.routes.ts` |
| Pages frontend | `pages/fiscalExport/FiscalExportPage.tsx` |
| Service frontend | `services/fiscalExport.service.ts` |
| Modèles Prisma | `journal_entries`, `fiscal_periods` |

**Statut : COMPLET**

---

## 23. Depreciations (Amortissements)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/depreciation.controller.ts` |
| Service | `backend/src/services/depreciation.service.ts` |
| Routes | `backend/src/routes/depreciation.routes.ts` |
| Pages frontend | `pages/depreciations/DepreciationsPage.tsx` |
| Service frontend | `services/depreciation.service.ts` |
| Modèles Prisma | `depreciations` |

**Statut : COMPLET**

---

## 24. Audit Logs (Journalisation)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/audit.controller.ts` |
| Service | `backend/src/services/audit.service.ts` |
| Routes | `backend/src/routes/audit.routes.ts` |
| Middleware | `backend/src/middleware/audit.middleware.ts` |
| Pages frontend | `pages/audit/AuditLogsPage.tsx` |
| Service frontend | `services/audit.service.ts` |
| Modèles Prisma | `audit_logs` |

**Statut : COMPLET**

---

## 25. HR (Ressources Humaines)

| Élément | Valeur |
|---------|--------|
| Controllers | `employee.controller.ts`, `attendance.controller.ts`, `payroll.controller.ts`, `leaveRequest.controller.ts`, `leavePolicy.controller.ts`, `leaveBalance.controller.ts`, `employeeDocument.controller.ts`, `hrCompliance.controller.ts` |
| Services | `employee.service.ts`, `attendance.service.ts`, `payroll.service.ts`, `leaveRequest.service.ts`, `leavePolicy.service.ts`, `leaveBalance.service.ts`, `employeeDocument.service.ts`, `hrCompliance.service.ts`, `employee-contract.service.ts` |
| Routes | `backend/src/routes/hr.routes.ts` |
| Pages frontend | `pages/hr/EmployeesListPage.tsx`, `EmployeeDetailPage.tsx`, `EmployeeFormPage.tsx`, `AttendancePage.tsx`, `AttendanceFormPage.tsx`, `PayrollPage.tsx`, `PayrollFormPage.tsx`, `LeaveRequestsPage.tsx`, `LeaveBalancesPage.tsx`, `HrCompliancePage.tsx` |
| Service frontend | `services/employee.service.ts`, `attendance.service.ts`, `payroll.service.ts`, `leaveRequest.service.ts`, `leaveBalance.service.ts`, `leavePolicy.service.ts`, `employeeDocument.service.ts`, `hrCompliance.service.ts` |
| Modèles Prisma | `employees`, `attendances`, `payrolls`, `payroll_items`, `leave_requests`, `leave_policies`, `leave_balances`, `employee_documents`, `employee_contracts` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST/GET | `/api/v1/hr/employees` |
| GET/PUT/DELETE | `/api/v1/hr/employees/:id` |
| POST/GET | `/api/v1/hr/attendance` |
| GET/PUT/DELETE | `/api/v1/hr/attendance/:id` |
| GET | `/api/v1/hr/attendance/employee/:employeeId/stats` |
| POST/GET | `/api/v1/hr/payroll` |
| GET/PUT/DELETE | `/api/v1/hr/payroll/:id` |
| GET | `/api/v1/hr/payroll/:id/pdf` |
| POST | `/api/v1/hr/payroll/:id/approve` |
| POST | `/api/v1/hr/payroll/:id/mark-paid` |
| POST/GET | `/api/v1/hr/leave-requests` |
| GET/PUT | `/api/v1/hr/leave-requests/:id` |
| POST | `/api/v1/hr/leave-requests/:id/approve` |
| POST | `/api/v1/hr/leave-requests/:id/reject` |
| POST | `/api/v1/hr/leave-requests/:id/cancel` |
| POST/GET | `/api/v1/hr/leave-policies` |
| GET/PUT/DELETE | `/api/v1/hr/leave-policies/:id` |
| GET | `/api/v1/hr/leave-policies/type/:type` |
| POST | `/api/v1/hr/leave-policies/defaults` |
| GET | `/api/v1/hr/leave-balances/employee/:employeeId` |
| GET | `/api/v1/hr/leave-balances/employee/:employeeId/balance` |
| POST/GET | `/api/v1/hr/employee-documents` |
| GET/PUT/DELETE | `/api/v1/hr/employee-documents/:id` |
| GET | `/api/v1/hr/employee-documents/expiring` |
| GET | `/api/v1/hr/employee-documents/expired` |
| GET | `/api/v1/hr/compliance/rdc` |

**Statut : COMPLET**

---

## 26. Stock Movements (Mouvements de stock)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/stock-movement.controller.ts` |
| Service | `backend/src/services/stock-movement.service.ts`, `stock.service.ts`, `stock-control.service.ts` |
| Routes | `backend/src/routes/stock-movement.routes.ts` |
| Pages frontend | `pages/stock/StockMovementsListPage.tsx` |
| Service frontend | `services/stockMovement.service.ts` |
| Modèles Prisma | `stock_movements`, `stock_movement_items`, `batches` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/stock-movements` |
| GET | `/api/v1/stock-movements` |
| GET | `/api/v1/stock-movements/:id` |
| POST | `/api/v1/stock-movements/:id/validate` |
| POST | `/api/v1/stock-movements/:id/reverse` |
| GET | `/api/v1/stock-movements/products/:productId/stock` |

**Statut : COMPLET**

---

## 27. Warehouses (Entrepôts)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/warehouse.controller.ts` |
| Service | `backend/src/services/warehouse.service.ts` |
| Routes | `backend/src/routes/warehouse.routes.ts` |
| Pages frontend | `pages/warehouses/WarehouseListPage.tsx`, `WarehouseFormPage.tsx` |
| Service frontend | `services/warehouse.service.ts` |
| Modèles Prisma | `warehouses` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST | `/api/v1/warehouses` |
| GET | `/api/v1/warehouses` |
| GET | `/api/v1/warehouses/:id` |
| PUT | `/api/v1/warehouses/:id` |
| DELETE | `/api/v1/warehouses/:id` |

**Statut : COMPLET**

---

## 28. Accountants (Expert-comptables)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/accountant.controller.ts` |
| Service | `backend/src/services/accountant.service.ts` |
| Routes | `backend/src/routes/accountant.routes.ts` |
| Pages frontend | `pages/accountant/AccountantDashboardPage.tsx`, `AccountantCompaniesPage.tsx`, `AccountantProfilePage.tsx`, `AccountantPublicProfilePage.tsx`, `AccountantRequestsPage.tsx`, `pages/settings/AccountantsSearchPage.tsx` |
| Composants | `components/accountant/CompanySelector.tsx`, `components/dashboard/AccountantDashboard.tsx`, `ExpertComptableDashboard.tsx` |
| Service frontend | `services/accountant.service.ts` |
| Modèles Prisma | `company_accountants`, `user_accountant_profiles` |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| POST/GET | `/api/v1/accountants` |
| GET/PUT/DELETE | `/api/v1/accountants/:id` |

**Statut : COMPLET**

---

## 29. Contracts (Contrats)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/contract.controller.ts` |
| Service | `backend/src/services/contract.service.ts` |
| Routes | `backend/src/routes/contract.routes.ts` |
| Pages frontend | `pages/contracts/ContractEditorPage.tsx` |
| Service frontend | `services/contract.service.ts` |
| Modèles Prisma | `contracts` |

**Statut : PARTIEL** (TODO : upload de fichier dans `ContractEditorPage.tsx`, notifications lors de la double signature dans `contract.service.ts`)

---

## 30. Dashboard

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/dashboard.controller.ts` |
| Service | `backend/src/services/dashboard.service.ts` |
| Routes | `backend/src/routes/dashboard.routes.ts` |
| Pages frontend | `pages/dashboard/DashboardPage.tsx` |
| Composants | `components/dashboard/RoleBasedDashboard.tsx`, `DefaultDashboard.tsx`, `OwnerDashboard.tsx`, `ManagerDashboard.tsx`, `EmployeeDashboard.tsx`, `RHDashboard.tsx`, `AccountantDashboard.tsx`, `ExpertComptableDashboard.tsx` |
| Service frontend | `services/dashboard.service.ts` |
| Modèles Prisma | (agrège plusieurs modèles) |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| GET | `/api/v1/dashboard` (détails NON DÉTERMINABLES sans lecture du fichier de routes) |

**Statut : PARTIEL** (TODO non résolus dans `EmployeeDashboard.tsx`, `RHDashboard.tsx`, `AccountantDashboard.tsx`, `ExpertComptableDashboard.tsx`)

---

## 31. Notifications

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/notification.controller.ts` |
| Service | `backend/src/services/notification.service.ts`, `reminder.service.ts`, `trial-reminder.service.ts` |
| Routes | `backend/src/routes/notification.routes.ts` |
| Pages frontend | `pages/notifications/NotificationsListPage.tsx`, `pages/settings/NotificationsSettingsPage.tsx` |
| Service frontend | `services/notification.service.ts` |
| Modèles Prisma | `notifications`, `notification_templates` |

**Statut : COMPLET**

---

## 32. Settings (Paramètres)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/settings.controller.ts` |
| Service | `backend/src/services/settings.service.ts`, `platform-settings.service.ts` |
| Routes | `backend/src/routes/settings.routes.ts` |
| Pages frontend | `pages/settings/SettingsPage.tsx`, `CompanySettingsPage.tsx`, `UserSettingsPage.tsx`, `SubscriptionPage.tsx`, `UpgradePage.tsx` |
| Service frontend | `services/settings.service.ts` |
| Modèles Prisma | `settings`, `platform_settings` |

**Statut : COMPLET**

---

## 33. Subscriptions (Abonnements)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/subscription.controller.ts` |
| Service | `backend/src/services/subscription.service.ts`, `subscription-payment.service.ts`, `quota.service.ts`, `usage.service.ts` |
| Routes | `backend/src/routes/subscription.routes.ts` |
| Pages frontend | `pages/settings/SubscriptionPage.tsx`, `UpgradePage.tsx`, `pages/onboarding/SelectPlanPage.tsx`, `AccountantSelectPlanPage.tsx` |
| Composants | `components/subscription/SubscriptionRequiredModal.tsx`, `SubscriptionStatusBanner.tsx` |
| Service frontend | NON DÉTERMINABLE depuis la liste |
| Modèles Prisma | `subscriptions`, `packages`, `usages` |

**Statut : COMPLET**

---

## 34. Packages (Plans tarifaires)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/package.controller.ts` |
| Service | `backend/src/services/package.service.ts` |
| Routes | `backend/src/routes/package.routes.ts` |
| Pages frontend | `pages/landing/PlansPage.tsx`, `pages/admin/AdminPlansPage.tsx` |
| Service frontend | `services/package.service.ts` |
| Modèles Prisma | `packages` |

**Statut : PARTIEL** (3 TODO d'audit dans `package.controller.ts`)

---

## 35. SuperAdmin

| Élément | Valeur |
|---------|--------|
| Service | `backend/src/services/superadmin.service.ts` |
| Routes | `backend/src/routes/superadmin.routes.ts` |
| Middleware | `backend/src/middleware/superadmin.middleware.ts` |
| Pages frontend | `pages/admin/AdminDashboardPage.tsx`, `AdminCompaniesPage.tsx`, `AdminCompanyDetailPage.tsx`, `AdminUsersPage.tsx`, `AdminAccountantsPage.tsx`, `AdminSettingsPage.tsx`, `AdminAuditLogsPage.tsx`, `AdminPaymentsPage.tsx`, `AdminBrandingPage.tsx` |
| Service frontend | `services/admin.service.ts` |
| Modèles Prisma | `users` (champs `is_super_admin`, `is_conta_user`, `conta_role`) |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| GET | `/api/v1/super-admin/stats` |
| GET | `/api/v1/super-admin/companies` |
| GET | `/api/v1/super-admin/companies/:id` |
| + autres (NON DÉTERMINABLES sans lecture complète) | |

**Statut : COMPLET**

---

## 36. Users (Gestion des utilisateurs)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/user.controller.ts` |
| Service | `backend/src/services/user.service.ts` |
| Routes | `backend/src/routes/user.routes.ts` |
| Pages frontend | `pages/settings/UsersUnifiedPage.tsx`, `pages/profile/UserProfilePage.tsx` |
| Composants | `components/users/PermissionEditor.tsx` |
| Service frontend | `services/user.service.ts` (NON DÉTERMINABLE depuis liste) |
| Modèles Prisma | `users` |

**Statut : COMPLET**

---

## 37. Account Deletion (Suppression de compte)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/account-deletion.controller.ts` |
| Service | `backend/src/services/account-deletion.service.ts` |
| Routes | `backend/src/routes/account-deletion.routes.ts` |
| Pages frontend | Aucune page dédiée trouvée |
| Modèles Prisma | `users`, `companies` (soft delete via `deleted_at`) |

**Statut : COMPLET** (backend), page frontend NON DÉTERMINABLE

---

## 38. Support

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/support.controller.ts` |
| Service | `backend/src/services/support.service.ts` |
| Routes | `backend/src/routes/support.routes.ts` |
| Pages frontend | `pages/support/SupportPage.tsx` |
| Service frontend | `services/support.service.ts` (NON DÉTERMINABLE depuis liste) |
| Modèles Prisma | `support_tickets` |

**Statut : COMPLET**

---

## 39. Branding (Personnalisation plateforme)

| Élément | Valeur |
|---------|--------|
| Service | `backend/src/services/platform-branding.service.ts` |
| Routes | `backend/src/routes/branding.routes.ts` |
| Pages frontend | `pages/admin/AdminBrandingPage.tsx` |
| Service frontend | `services/branding.service.ts` |
| Modèles Prisma | `platform_branding` |

**Statut : COMPLET**

---

## 40. Webhooks

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/webhook.controller.ts` |
| Routes | `backend/src/routes/webhook.routes.ts` |
| Modèles Prisma | Aucun modèle dédié |

**Statut : PARTIEL** (2 TODO dans `webhook.controller.ts` : logique de traitement des messages entrants WhatsApp non implémentée, mise à jour statut en BDD absente)

---

## 41. Search (Recherche globale)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/search.controller.ts` |
| Service | `backend/src/services/search.service.ts` |
| Routes | `backend/src/routes/search.routes.ts` |
| Composants frontend | `components/search/GlobalSearch.tsx` |
| Service frontend | `services/search.service.ts` (NON DÉTERMINABLE depuis liste) |
| Modèles Prisma | (agrège plusieurs modèles) |

**Statut : COMPLET**

---

## 42. Realtime

| Élément | Valeur |
|---------|--------|
| Service | `backend/src/services/realtime.service.ts` |
| Routes | `backend/src/routes/realtime.routes.ts` |
| Modèles Prisma | Aucun modèle dédié |

**Statut : COMPLET**

---

## 43. Cron

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/cron.controller.ts` |
| Service | `backend/src/services/scheduler.service.ts` |
| Routes | `backend/src/routes/cron.routes.ts` |
| Modèles Prisma | Aucun modèle dédié |

**Statut : COMPLET**

---

## 44. Datarissage (Paramétrage initial entreprise)

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/datarissage.controller.ts` |
| Service | `backend/src/services/datarissage.service.ts` |
| Routes | `backend/src/routes/datarissage.routes.ts` |
| Middleware | `backend/src/middleware/datarissage.middleware.ts` |
| Modèles Prisma | `company_datarissage_settings` (champs `datarissage_completed`, `datarissage_completed_at` sur `companies`) |

**Statut : COMPLET**

---

## 45. Currency (Multi-devises)

| Élément | Valeur |
|---------|--------|
| Services | `backend/src/services/currency/currencyHelper.service.ts`, `currencyUpdate.service.ts`, `exchangeRate.service.ts`, `currency/index.ts`, `providers/bcc.provider.ts`, `providers/ecb.provider.ts` |
| Routes | Aucune route dédiée (intégré dans settings) |
| Modèles Prisma | `currency_settings`, `exchange_rates` |

**Statut : COMPLET**

---

## 46. Admin Cache

| Élément | Valeur |
|---------|--------|
| Controller | `backend/src/controllers/admin/queueAdmin.controller.ts` |
| Routes | `backend/src/routes/admin.routes.ts` |
| Services | `backend/src/services/cache.service.ts`, `cache/cacheMonitoring.service.ts`, `cache/cacheWarming.service.ts`, `queue.service.ts`, `queue/queueMonitoring.service.ts` |
| Modèles Prisma | Aucun |

**Endpoints API :**
| Méthode | Route |
|---------|-------|
| GET/POST | `/api/v1/admin/cache/*` (détails NON DÉTERMINABLES sans lecture du fichier de routes) |

**Statut : COMPLET**

---

## 47. WhatsApp

| Élément | Valeur |
|---------|--------|
| Services | `backend/src/services/whatsapp/whatsapp.service.ts`, `providers/meta.provider.ts`, `providers/types.ts` |
| Routes | Intégré dans webhooks + notifications |
| Scripts | `generate-whatsapp-token.js`, `generate-whatsapp-token-auto.js`, `generate-whatsapp-token-existing-chrome.js`, `generate-whatsapp-token-simple.js` (racine backend) |
| Modèles Prisma | Aucun modèle dédié |

**Statut : PARTIEL** (traitement des messages entrants non implémenté dans webhook.controller.ts)

---

## 48. PDF & Templates

| Élément | Valeur |
|---------|--------|
| Service | `backend/src/services/pdf.service.ts`, `template.service.ts` |
| Templates factures | 24 fichiers HTML dans `backend/src/templates/invoices/` |
| Templates emails | 16 fichiers HTML dans `backend/src/templates/emails/` |
| Template paie | `backend/src/templates/payroll/payslip.html` |
| Rendu | Puppeteer (PDF), Handlebars (HTML) |
| Modèles Prisma | Aucun |

**Statut : COMPLET**

---

## 49. File Upload

| Élément | Valeur |
|---------|--------|
| Service | `backend/src/services/fileUpload.service.ts`, `storage.service.ts` |
| Middleware | `backend/src/middleware/upload.middleware.ts` |
| Modèles Prisma | `file_uploads` |

**Statut : COMPLET**

---

## 50. Events (Domain Events)

| Élément | Valeur |
|---------|--------|
| Services | `backend/src/events/event-bus.ts`, `domain-event.ts`, `event-registry.ts`, `index.ts` |
| Handlers | `handlers/accounting.handlers.ts`, `handlers/hr.handlers.ts`, `handlers/invoice-data.handlers.ts`, `handlers/invoice.handlers.ts`, `handlers/stock.handlers.ts` |
| Services associés | `eventReplay.service.ts` |
| Modèles Prisma | `domain_events` |

**Statut : PARTIEL** (TODO dans `stock.handlers.ts` : valorisation stock FIFO/weighted_average non implémentée)
