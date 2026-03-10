# 03_DATABASE — Schéma de base de données

## Informations générales

| Paramètre | Valeur |
|-----------|--------|
| SGBD | PostgreSQL |
| ORM | Prisma 5.22.0 |
| Fichier schema | `database/prisma/schema.prisma` |
| Preview features | `views` |
| Nombre de modèles | 58 |
| Nombre de vues | 1 |
| Nombre d'enums | 1 |
| Total de migrations | 37 dossiers de migration |

---

## Enum

### `AccountType`
```
ENTREPRENEUR
STARTUP
ONG_FIRM
EXPERT_COMPTABLE
```
Utilisé sur le modèle `companies.account_type` (défaut : `STARTUP`).

---

## Vue

### `account_balances_view`
| Champ | Type |
|-------|------|
| accountId (`account_id`) | String @id |
| companyId (`company_id`) | String |
| balance | Decimal(15,2) |

---

## Modèles Prisma — Liste exhaustive

### 1. `users`
| Champ | Type | Notes |
|-------|------|-------|
| id | String @id | |
| company_id | String? | FK → companies |
| email | String @unique | |
| password_hash | String | |
| first_name | String? | |
| last_name | String? | |
| phone | String? | |
| email_verified | Boolean? | défaut false |
| email_verification_token | String? | |
| email_verification_expires_at | DateTime? | |
| two_factor_enabled | Boolean? | défaut false |
| two_factor_secret | String? | |
| two_factor_backup_codes | String[] | |
| password_reset_token | String? | |
| password_reset_expires_at | DateTime? | |
| role | String? | défaut "manager" |
| permissions | Json? | défaut {} |
| preferences | Json? | défaut {} |
| language | String? | défaut "fr" |
| timezone | String? | défaut "Africa/Kinshasa" |
| last_login_at | DateTime? | |
| last_login_ip | String? | |
| failed_login_attempts | Int? | défaut 0 |
| locked_until | DateTime? | |
| is_accountant | Boolean | défaut false |
| is_conta_user | Boolean | défaut false |
| is_super_admin | Boolean | défaut false |
| conta_role | String? | |
| conta_permissions | Json? | défaut {} |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | (soft delete) |

**Index :** `company_id`, `email`, `deleted_at`, `is_accountant`

---

### 2. `companies`
| Champ | Type | Notes |
|-------|------|-------|
| id | String @id | |
| name | String | |
| email | String @unique | |
| currency | String? | défaut "CDF" |
| country | String? | défaut "RDC" |
| account_type | AccountType | défaut STARTUP |
| nif | String? @unique | |
| rccm | String? | |
| def | String? | |
| invoice_prefix | String? | défaut "FAC" |
| next_invoice_number | Int? | défaut 1 |
| invoice_template_id | String? | défaut "template-1-modern" |
| quotation_prefix | String? | défaut "DEV" |
| credit_note_prefix | String? | défaut "AV" |
| paypal_enabled | Boolean? | défaut false |
| paypal_mode | String? | défaut "sandbox" |
| visapay_enabled | Boolean? | défaut false |
| maxicash_enabled | Boolean? | défaut false |
| reminders_enabled | Boolean? | défaut false |
| module_facturation_enabled | Boolean | défaut true |
| module_comptabilite_enabled | Boolean | défaut true |
| module_stock_enabled | Boolean | défaut false |
| module_rh_enabled | Boolean | défaut false |
| stock_valuation_method | String? | |
| rh_payroll_enabled | Boolean? | défaut false |
| datarissage_completed | Boolean | défaut false |
| is_system_company | Boolean? | défaut false |
| timezone | String? | défaut "Africa/Kinshasa" |
| deleted_at | DateTime? | (soft delete) |
| + champs VisaPay (12 champs) | | clés de chiffrement/signature |
| + champs MaxiCash (5 champs) | | |
| + champs reminders (5 champs) | | |
| + champs RH (6 champs) | | |
| + champs stock (5 champs) | | |

**Index :** `email`, `nif`, `deleted_at`, `is_system_company`, `system_type`

---

### 3. `invoices`
| Champ clé | Type | Notes |
|-----------|------|-------|
| id | String @id | |
| company_id | String | FK → companies |
| customer_id | String | FK → customers |
| invoice_number | String | Unique(company_id, invoice_number) |
| status | String | défaut "draft" |
| subtotal | Decimal(15,2) | |
| tax_amount | Decimal(15,2) | |
| total_amount | Decimal(15,2) | |
| currency | String? | défaut "CDF" |
| base_currency | String? | défaut "CDF" |
| exchange_rate | Decimal(18,8)? | défaut 1.0 |
| base_total_amount | Decimal(15,2)? | |
| recurring_invoice_id | String? | FK → recurring_invoices |
| reason | String?(500) | |
| deleted_at | DateTime? | |

**Index :** `company_id`, `customer_id`, `status`, `invoice_date`, `due_date`, `deleted_at`, `recurring_invoice_id`

---

### 4. `invoice_lines`
| Champ | Type |
|-------|------|
| id | String @id |
| invoice_id | String FK → invoices (Cascade) |
| product_id | String? FK → products |
| description | String |
| quantity | Decimal(15,2) |
| unit_price | Decimal(15,2) |
| tax_rate | Decimal(5,2) |
| tax_amount | Decimal(15,2) |
| subtotal | Decimal(15,2) |
| total | Decimal(15,2) |

---

### 5. `customers`
| Champ clé | Type |
|-----------|------|
| id | String @id |
| company_id | String FK → companies |
| type | String défaut "particulier" |
| first_name, last_name, business_name | String? |
| email, phone, mobile | String? |
| nif, rccm | String? |
| tags | String[] défaut [] |
| deleted_at | DateTime? |

**Index :** `company_id`, `email`, `type`, `deleted_at`

---

### 6. `products`
| Champ clé | Type |
|-----------|------|
| id | String @id |
| company_id | String FK → companies |
| sku | String? @unique |
| type | String défaut "product" |
| price | Decimal(15,2) |
| cost | Decimal(15,2)? |
| stock | Decimal(15,2)? |
| min_stock | Decimal(15,2)? |
| max_stock | Decimal(15,2)? |
| track_stock | Boolean? défaut false |
| is_active | Boolean? défaut true |
| deleted_at | DateTime? |

---

### 7. `payments`
| Champ clé | Type |
|-----------|------|
| id | String @id |
| company_id | String FK → companies |
| invoice_id | String FK → invoices |
| amount | Decimal(15,2) |
| currency | String? défaut "CDF" |
| payment_method | String |
| mobile_money_provider | String? |
| transaction_reference | String? |
| base_currency | String? défaut "CDF" |
| exchange_rate | Decimal(18,8)? |
| base_amount | Decimal(15,2)? |
| status | String défaut "confirmed" |
| reason | String?(500) |
| deleted_at | DateTime? |

**Index :** `company_id`, `invoice_id`, `payment_date`, `payment_method`, `status`, `deleted_at`

---

### 8. `quotations` / `quotation_lines`
Structure identique à `invoices`/`invoice_lines` avec :
- Champs supplémentaires : `expiration_date`, `accepted_at`, `rejected_at`, `expired_at`
- `invoice_id` : FK optionnel vers `invoices` (conversion devis→facture)

---

### 9. `credit_notes`
Structure similaire à `invoices` avec :
- Champs : `credit_note_number`, `applied_amount`, `applied_at`, `return_stock`
- FK vers `invoices`

---

### 10. `recurring_invoices` / `recurring_invoice_lines`
| Champ clé | Type |
|-----------|------|
| frequency | String |
| start_date, end_date | DateTime |
| next_run_date | DateTime? |
| last_run_date | DateTime? |
| last_invoice_id | String? |
| total_generated | Int défaut 0 |
| is_active | Boolean défaut true |

---

### 11. `expenses`
| Champ clé | Type |
|-----------|------|
| company_id | String FK → companies |
| category_id | String? FK → expense_categories |
| supplier_id | String? FK → suppliers |
| account_id | String? FK → accounts |
| amount | Decimal(15,2) |
| amount_ht, amount_ttc | Decimal? |
| base_currency | String? |
| exchange_rate | Decimal(18,8)? |
| status | String défaut "draft" |
| reason | String?(500) |

---

### 12. `ExpenseAttachment`
| Champ | Type |
|-------|------|
| expenseId | String FK → expenses (Cascade) |
| companyId | String FK → companies (Cascade) |
| uploadedBy | String FK → users |
| filename, originalName | String |
| mimetype, url | String |
| size | Int |

---

### 13. `ExpenseApproval`
| Champ | Type |
|-------|------|
| expenseId, companyId | String |
| ruleId | String? FK → ExpenseApprovalRule |
| status | String |
| requestedBy, approvedBy, rejectedBy | String |
| rejectionReason | String? |

**Index :** `expenseId`, `companyId`, `status`, `requestedBy`, `approvedBy`

---

### 14. `ExpenseApprovalRule`
| Champ | Type |
|-------|------|
| companyId | String |
| amountThreshold | Decimal(10,2)? |
| categoryId | String? |
| requireJustificatif | Boolean |
| approvers | Json défaut [] |

---

### 15. `expense_categories`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| account_id | String? FK → accounts |
| is_active | Boolean? |
| display_order | Int? défaut 0 |

---

### 16. `suppliers`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| account_id | String? FK → accounts |
| nif, rccm | String? |
| is_active | Boolean? |
| deleted_at | DateTime? |

---

### 17. `accounts`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| code | String VarChar(20) |
| type | String VarChar(50) |
| category | String? |
| parent_id | String? FK → accounts (self-reference) |
| balance | Decimal(15,2) défaut 0 |
| is_active | Boolean? |

**Contrainte :** UNIQUE(company_id, code)
**Index :** `company_id`, `type`, `category`, `is_active`, `parent_id`

---

### 18. `journal_entries`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| entry_number | String Unique(company_id, entry_number) |
| source_type | String défaut "manual" |
| source_id | String? |
| status | String défaut "draft" |
| reversed_entry_id | String? FK → journal_entries (self-reference) |
| reason | String?(500) |
| posted_at | DateTime? |

---

### 19. `journal_entry_lines`
| Champ | Type |
|-------|------|
| journal_entry_id | String FK → journal_entries (Cascade) |
| account_id | String FK → accounts |
| debit | Decimal(15,2) défaut 0 |
| credit | Decimal(15,2) défaut 0 |

---

### 20. `fiscal_periods`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| name | String |
| start_date, end_date | DateTime @db.Date |
| status | String défaut "open" |
| closed_at | DateTime? |
| closed_by | String? |

---

### 21. `bank_statements`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| account_id | String FK → accounts |
| statement_number | String Unique(company_id, statement_number) |
| opening_balance, closing_balance | Decimal(15,2) |
| status | String défaut "draft" |
| deleted_at | DateTime? |

---

### 22. `bank_transactions`
| Champ | Type |
|-------|------|
| statement_id | String FK → bank_statements (Cascade) |
| amount | Decimal(15,2) |
| type | String |
| is_reconciled | Boolean défaut false |
| reconciled_with | String? |
| reconciled_type | String? |

---

### 23. `employees`
| Champ clé | Type |
|-----------|------|
| company_id | String FK → companies |
| employee_number | String Unique(company_id, employee_number) |
| manager_id | String? FK → employees (self-reference) |
| hire_date | DateTime @db.Date |
| termination_date | DateTime? |
| employment_type | String? défaut "full_time" |
| status | String défaut "active" |
| base_salary | Decimal(15,2) |
| deleted_at | DateTime? |

---

### 24. `attendances`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| employee_id | String FK → employees |
| date | DateTime @db.Date |
| check_in, check_out | DateTime? |
| hours_worked | Decimal(5,2)? |
| status | String défaut "present" |

**Contrainte :** UNIQUE(company_id, employee_id, date)

---

### 25. `payrolls`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| employee_id | String FK → employees |
| period_start, period_end | DateTime @db.Date |
| pay_date | DateTime @db.Date |
| gross_salary | Decimal(15,2) |
| total_deductions | Decimal(15,2) |
| net_salary | Decimal(15,2) |
| status | String défaut "draft" |

---

### 26. `payroll_items`
| Champ | Type |
|-------|------|
| payroll_id | String FK → payrolls (Cascade) |
| type | String |
| is_deduction | Boolean défaut false |
| amount | Decimal(15,2) |

---

### 27. `leave_requests`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| employee_id | String FK → employees |
| leave_type | String |
| days_requested | Decimal(5,2) |
| status | String défaut "pending" |
| approved_by | String? FK → users |
| rejected_by | String? FK → users |

---

### 28. `leave_policies`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| leave_type | String Unique(company_id, leave_type) |
| days_per_year | Decimal(5,2) |
| carry_forward | Boolean défaut false |
| requires_approval | Boolean défaut true |

---

### 29. `leave_balances`
| Champ | Type |
|-------|------|
| company_id, employee_id | String FK |
| leave_type | String |
| year | Int |
| total_days, used_days, pending_days, remaining_days, carried_forward | Decimal(5,2) |

**Contrainte :** UNIQUE(company_id, employee_id, leave_type, year)

---

### 30. `employee_documents`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| employee_id | String FK → employees |
| file_id | String FK → file_uploads |
| document_type | String |
| expiry_date | DateTime? @db.Date |
| is_expired | Boolean défaut false |
| deleted_at | DateTime? |

---

### 31. `employee_contracts`
| Champ | Type |
|-------|------|
| company_id | String |
| employee_id | String |
| contract_type | String |
| start_date | DateTime @db.Date |
| base_salary | Decimal(15,2) |
| status | String défaut "active" |
| terminated_at | DateTime? |
| deleted_at | DateTime? |

**⚠️ ATTENTION :** Aucune directive `@relation` déclarée — pas de FK Prisma vers `companies` ni `employees`.

**Contrainte :** UNIQUE(employee_id, start_date)

---

### 32. `stock_movements`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| movement_type | String VarChar(20) |
| status | String défaut "DRAFT" |
| created_by | String? FK → users |
| validated_by | String? FK → users |
| reversed_from_id | String? @unique FK → stock_movements |

**Index :** `company_id`, `movement_type`, `status`, `(reference, reference_id)`, `created_at`, `validated_at`, `reversed_at`

---

### 33. `stock_movement_items`
| Champ | Type |
|-------|------|
| stock_movement_id | String FK → stock_movements (Cascade) |
| product_id | String FK → products (Cascade) |
| warehouse_id | String? FK → warehouses |
| warehouse_to_id | String? (pas de FK Prisma déclarée) |
| quantity | Decimal(15,2) (toujours positive) |
| batch_id | String? FK → batches |
| serial_number | String? |

---

### 34. `warehouses`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| code | String? |
| is_active | Boolean défaut true |
| is_default | Boolean défaut false |
| deleted_at | DateTime? |

---

### 35. `batches`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| product_id | String FK → products (Cascade) |
| batch_number | String VarChar(100) |
| quantity | Decimal(15,2) |
| expiry_date | DateTime? @db.Date |
| production_date | DateTime? @db.Date |

**Contrainte :** UNIQUE(company_id, product_id, batch_number)

---

### 36. `depreciations`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| asset_account_id | String FK → accounts |
| depreciation_account_id | String FK → accounts |
| depreciation_method | String |
| depreciation_rate | Decimal(5,2) |
| purchase_amount | Decimal(15,2) |
| purchase_date, start_date | DateTime @db.Date |
| is_active | Boolean défaut true |

---

### 37. `subscriptions`
| Champ | Type |
|-------|------|
| company_id | String @unique FK → companies |
| package_id | String FK → packages |
| status | String défaut "active" |
| billing_cycle | String |
| trial_ends_at | DateTime? |
| cancelled_at | DateTime? |

---

### 38. `packages`
| Champ | Type |
|-------|------|
| code | String @unique |
| price | Decimal(15,2) |
| billing_cycle | String? |
| limits | Json? défaut {} |
| features | Json? défaut {} |
| is_active | Boolean? |
| display_order | Int? |

---

### 39. `usages`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| metric | String VarChar(100) |
| period | String VarChar(20) |
| period_date | DateTime @db.Date |
| value | Decimal(15,2) |

**Contrainte :** UNIQUE(company_id, metric, period, period_date)

---

### 40. `notifications`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| type | String VarChar(50) |
| title | String VarChar(255) |
| message | String |
| read | Boolean défaut false |
| data | Json? défaut {} |

**Index :** `company_id`, `read`, `created_at`

---

### 41. `notification_templates`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| type | String |
| name | String |
| subject | String? |
| body | String |
| is_active | Boolean? |

---

### 42. `settings`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| key | String VarChar(100) |
| value | String |

**Contrainte :** UNIQUE(company_id, key)

---

### 43. `platform_settings`
| Champ | Type |
|-------|------|
| paypal_enabled | Boolean? |
| paypal_client_id, paypal_secret_key | String? |
| paypal_mode | String? |
| smtp_host, smtp_port, smtp_user, smtp_pass | String?/Int? |
| smtp_invoice_from, smtp_notif_from | String? |
| visapay_enabled | Boolean? |
| visapay_encryption_key_id, visapay_signing_key_id | String? |

---

### 44. `platform_branding`
| Champ | Type |
|-------|------|
| logo_url, favicon_url, email_logo_url, pdf_logo_url | String? |
| primary_color, secondary_color, accent_color, background_color | String?(7) |
| primary_font, secondary_font | String? |
| theme | String? défaut "light" |
| updated_by | String? |

---

### 45. `audit_logs`
| Champ | Type |
|-------|------|
| company_id | String? FK → companies |
| user_id | String? |
| action | String VarChar(100) |
| entity | String VarChar(100) |
| entity_id | String? |
| module | String? VarChar(50) |
| user_role | String? |
| hash | String?(64) |
| previous_hash | String?(64) |
| before_state, after_state | Json? |
| justification, reason | String? |

**Index :** `company_id`, `user_id`, `entity`, `entity_id`, `created_at`, `module`, `action`

---

### 46. `domain_events`
| Champ | Type |
|-------|------|
| type | String VarChar(100) |
| entity_type | String VarChar(100) |
| entity_id | String VarChar(255) |
| data, metadata | Json |
| correlation_id | String? |
| causation_id | String? |
| company_id | String? FK → companies |

---

### 47. `idempotency_keys`
| Champ | Type |
|-------|------|
| company_id | String VarChar(255) FK → companies |
| key | String VarChar(255) |
| endpoint | String VarChar(255) |
| request_hash | String |
| response_code | Int |
| response_body | Json? |
| expires_at | DateTime Timestamp(6) |

**Contrainte :** UNIQUE(company_id, key)
**Index :** `created_at`, `expires_at`

---

### 48. `currency_settings`
| Champ | Type |
|-------|------|
| company_id | String @unique FK → companies |
| base_currency | String défaut "CDF" |
| auto_update_rates | Boolean? défaut false |
| rate_provider | String? défaut "manual" |
| last_rate_update | DateTime? |

---

### 49. `exchange_rates`
| Champ | Type |
|-------|------|
| from_currency, to_currency | String VarChar(3) |
| rate | Decimal(18,8) |
| effective_date | DateTime @db.Date |
| source | String? défaut "manual" |

**Contrainte :** UNIQUE(from_currency, to_currency, effective_date)
**Index composite :** `(from_currency, to_currency, effective_date DESC)`, `effective_date DESC`

---

### 50. `contracts`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| accountant_id | String FK → users |
| type | String défaut "accountant_service" |
| status | String défaut "draft" |
| company_signed_at, accountant_signed_at | DateTime? |
| start_date, end_date | DateTime? |

---

### 51. `company_accountants`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| accountant_id | String FK → users |
| contract_id | String? FK → contracts |
| status | String défaut "pending" |
| invited_at | DateTime |
| accepted_at, rejected_at, revoked_at | DateTime? |

**Contrainte :** UNIQUE(company_id, accountant_id)

---

### 52. `user_accountant_profiles`
| Champ | Type |
|-------|------|
| user_id | String @unique FK → users |
| specialization | String[] défaut [] |
| experience_years | Int? |
| is_available | Boolean défaut true |
| max_companies | Int? |
| total_companies_managed | Int défaut 0 |
| active_companies_count | Int défaut 0 |
| rating | Decimal(3,2)? défaut 0 |
| total_reviews | Int défaut 0 |

---

### 53. `support_tickets`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| user_id | String? FK → users |
| subject | String VarChar(255) |
| category, priority | String |
| status | String défaut "open" |
| response | String? |
| attachments | String[] défaut [] |
| resolved_at, closed_at | DateTime? |

---

### 54. `file_uploads`
| Champ | Type |
|-------|------|
| company_id | String FK → companies |
| file_name, original_name | String |
| path | String VarChar(500) |
| mime_type | String |
| size | Int |
| related_type | String? VarChar(50) |
| related_id | String? |

---

### 55. `onboarding_progress`
| Champ | Type |
|-------|------|
| company_id | String @unique FK → companies |
| 13 étapes (profile_completed, first_invoice_created, etc.) | Boolean défaut false |
| current_phase | Int défaut 1 |
| total_steps | Int défaut 13 |
| completed_steps | Int défaut 0 |
| completed_at | DateTime? |

---

### 56. `company_datarissage_settings`
| Champ | Type |
|-------|------|
| company_id | String @unique FK → companies |
| currency_locked | Boolean défaut false |
| business_type_locked | Boolean défaut false |
| stock_management_type_locked | Boolean défaut false |
| stock_valuation_method_locked | Boolean défaut false |
| rh_payroll_enabled_locked | Boolean défaut false |
| locked_at | DateTime? |
| locked_by | String? |

---

## Relations principales entre modèles

```
companies ──────────────────────────────────────────────────────────
  │── users (1:N)
  │── customers (1:N)
  │── invoices (1:N)
  │── payments (1:N)
  │── expenses (1:N)
  │── expense_categories (1:N)
  │── suppliers (1:N)
  │── accounts (1:N)
  │── journal_entries (1:N)
  │── products (1:N)
  │── quotations (1:N)
  │── credit_notes (1:N)
  │── recurring_invoices (1:N)
  │── fiscal_periods (1:N)
  │── bank_statements (1:N)
  │── employees (1:N)
  │── attendances (1:N)
  │── payrolls (1:N)
  │── leave_requests (1:N)
  │── leave_policies (1:N)
  │── leave_balances (1:N)
  │── employee_documents (1:N)
  │── depreciations (1:N)
  │── stock_movements (1:N)
  │── warehouses (1:N)
  │── batches (1:N)
  │── subscriptions (1:1)
  │── packages (via subscriptions)
  │── settings (1:N)
  │── notifications (1:N)
  │── notification_templates (1:N)
  │── audit_logs (1:N)
  │── domain_events (1:N)
  │── idempotency_keys (1:N)
  │── currency_settings (1:1)
  │── company_accountants (1:N)
  │── contracts (1:N)
  │── support_tickets (1:N)
  │── file_uploads (1:N)
  │── onboarding_progress (1:1)
  │── company_datarissage_settings (1:1)
  │── usages (1:N)
  └── ExpenseAttachment (1:N)

invoices ───────────────────────────────
  │── invoice_lines (1:N, Cascade)
  │── payments (1:N)
  │── credit_notes (1:N)
  └── quotations (via invoice_id, 1:N)

accounts ──── self-reference (parent_id)
employees ─── self-reference (manager_id)
journal_entries ─── self-reference (reversed_entry_id)
stock_movements ─── self-reference (reversed_from_id @unique)
```

---

## Migrations — Liste des dossiers

| Dossier | Contenu |
|---------|---------|
| `20250101000000_add_expense_attachments` | |
| `20250101000000_add_fiscal_periods` | **⚠️ TIMESTAMP IDENTIQUE** |
| `20250101000000_add_recurring_invoices_and_reminders` | **⚠️ TIMESTAMP IDENTIQUE** |
| `20250101000001_add_expense_approval_workflow` | |
| `20250102000000_add_missing_invoice_and_expense_fields` | |
| `20250120000000_add_quotations` | |
| `20250120000001_add_credit_notes` | |
| `20250120000002_add_recurring_invoice_lines` | |
| `20250120000003_add_recurring_invoice_id_to_invoices` | |
| `20251124150815_add_recurring_invoices_and_reminders` | **⚠️ NOM DUPLIQUÉ** (même nom que 20250101000000_) |
| `20251126160000_add_depreciations` | |
| `20251129172746_add_invoice_reference_fields` | |
| `20251203181835_add_hr_leave_management` | |
| `20251211155235_add_super_admin_fields` | |
| `20251211155725_add_system_company_fields` | |
| `20251212130436_add_platform_branding` | |
| `20251217120000_add_account_type_to_companies` | |
| `20260105105303_add_datarissage` | |
| `20260105112732_add_stock_movements` | **⚠️ NOM DUPLIQUÉ** |
| `20260105114741_add_advanced_stock_module` | **⚠️ NOM DUPLIQUÉ** |
| `20260105120000_add_stock_movements` | **⚠️ DOUBLON** (même nom 3h plus tard) |
| `20260105130000_add_advanced_stock_module` | **⚠️ DOUBLON** (même nom ~2h plus tard) |
| `20260123000001_add_reason_fields_for_audit` | |
| `20260125092248_add_reversed_entry_id` | **⚠️ DOUBLON probable** |
| `20260125_account_balances_view` | |
| `20260125_add_domain_events` | |
| `20260125_add_performance_indexes` | |
| `20260125_add_reversed_entry_id` | **⚠️ DOUBLON probable** (même nom, format différent) |
| `20260125_audit_log_immutability` | |
| `20260125_fiscal_period_enforcement` | |
| `20260125_fiscal_period_locks` | |
| `20260125_idempotency_keys` | |
| `20260125_multi_currency_phase1` | |
| `20260125_multi_currency_phase2` | |
| `1769178710_add_reason_fields` | **⚠️ TIMESTAMP UNIX** (format non standard) |
| `9999_add_supplier_account` | **⚠️ NUMÉROTATION NON STANDARD** |
| `$(date +%Y%m%d%H%M%S)_add_platform_branding` | **⚠️ NOM DE DOSSIER NON RÉSOLU** (variable shell non interpolée) |
| `create_hr_tables.sql` | **⚠️ FICHIER SQL DIRECT** (pas un dossier de migration Prisma) |
| `manual_add_super_admin` | **⚠️ NOM SANS TIMESTAMP** |

---

## Index et contraintes notables

| Modèle | Contrainte/Index notable |
|--------|------------------------|
| `accounts` | UNIQUE(company_id, code) |
| `users` | UNIQUE(email) ; champ `locked_until` pour protection brute force |
| `companies` | UNIQUE(email), UNIQUE(nif) |
| `invoices` | UNIQUE(company_id, invoice_number) |
| `quotations` | UNIQUE(company_id, quotation_number) |
| `credit_notes` | UNIQUE(company_id, credit_note_number) |
| `recurring_invoices` | Index sur next_run_date (pour le scheduler cron) |
| `exchange_rates` | UNIQUE(from_currency, to_currency, effective_date) |
| `idempotency_keys` | UNIQUE(company_id, key) + Index expires_at (TTL) |
| `audit_logs` | Champs hash/previous_hash (chaîne d'intégrité) |
| `stock_movements` | reversed_from_id @unique (un mouvement ne peut être inversé qu'une fois) |
| `attendances` | UNIQUE(company_id, employee_id, date) |
| `leave_policies` | UNIQUE(company_id, leave_type) |
| `leave_balances` | UNIQUE(company_id, employee_id, leave_type, year) |
| `currency_settings` | @unique sur company_id (une config par entreprise) |
| `subscriptions` | @unique sur company_id (un abonnement par entreprise) |
