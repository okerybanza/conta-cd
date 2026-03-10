-- SPRINT 3 - TASK 3.3 (PERF-002): Performance Indexes for N+1 Query Optimization
-- This migration adds indexes to optimize aggregation queries and list operations

-- Customer-Invoice relationship (for aggregations in customer list)
-- Composite index for efficient groupBy operations
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status_deleted 
ON invoices(customer_id, status, deleted_at) 
WHERE deleted_at IS NULL;

-- Invoice filtering by company and date (for reports and dashboards)
CREATE INDEX IF NOT EXISTS idx_invoices_company_date_deleted 
ON invoices(company_id, invoice_date, deleted_at) 
WHERE deleted_at IS NULL;

-- Invoice status filtering (for unpaid invoice queries)
CREATE INDEX IF NOT EXISTS idx_invoices_status_deleted 
ON invoices(status, deleted_at) 
WHERE deleted_at IS NULL;

-- Journal Entry filtering by company and date
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date_status 
ON journal_entries(company_id, entry_date, status);

-- Journal Entry Lines for aggregations
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_account 
ON journal_entry_lines(entry_id, account_id);

-- Customer filtering and search
CREATE INDEX IF NOT EXISTS idx_customers_company_deleted 
ON customers(company_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Product stock lookups (for future optimization)
CREATE INDEX IF NOT EXISTS idx_products_company_deleted 
ON products(company_id, deleted_at) 
WHERE deleted_at IS NULL;
