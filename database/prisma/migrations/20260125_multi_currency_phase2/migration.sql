-- SPRINT 2 - TASK 2.4 (FIN-003): Multi-Currency Support - Phase 2
-- This migration adds multi-currency support to transactions (invoices, expenses, payments)

-- ============================================================================
-- INVOICES: Add base currency tracking
-- ============================================================================
ALTER TABLE invoices 
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'CDF',
ADD COLUMN exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
ADD COLUMN base_subtotal DECIMAL(15, 2),
ADD COLUMN base_tax_amount DECIMAL(15, 2),
ADD COLUMN base_total_amount DECIMAL(15, 2);

-- Update existing invoices to have base amounts equal to transaction amounts
UPDATE invoices 
SET 
  base_currency = COALESCE(currency, 'CDF'),
  exchange_rate = 1.0,
  base_subtotal = subtotal,
  base_tax_amount = tax_amount,
  base_total_amount = total_amount
WHERE base_subtotal IS NULL;

-- Add index for currency filtering
CREATE INDEX idx_invoices_currency ON invoices(currency) WHERE deleted_at IS NULL;

COMMENT ON COLUMN invoices.currency IS 'Transaction currency (customer currency)';
COMMENT ON COLUMN invoices.base_currency IS 'Company base currency for reporting';
COMMENT ON COLUMN invoices.exchange_rate IS 'Exchange rate used at invoice date (1 transaction currency = rate * base currency)';
COMMENT ON COLUMN invoices.base_subtotal IS 'Subtotal in company base currency';
COMMENT ON COLUMN invoices.base_tax_amount IS 'Tax amount in company base currency';
COMMENT ON COLUMN invoices.base_total_amount IS 'Total amount in company base currency';

-- ============================================================================
-- EXPENSES: Add base currency tracking
-- ============================================================================
ALTER TABLE expenses 
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'CDF',
ADD COLUMN exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
ADD COLUMN base_amount_ht DECIMAL(15, 2),
ADD COLUMN base_tax_amount DECIMAL(15, 2),
ADD COLUMN base_amount_ttc DECIMAL(15, 2);

-- Update existing expenses
UPDATE expenses 
SET 
  base_currency = COALESCE(currency, 'CDF'),
  exchange_rate = 1.0,
  base_amount_ht = amount_ht,
  base_tax_amount = tax_amount,
  base_amount_ttc = amount_ttc
WHERE base_amount_ht IS NULL;

-- Add index
CREATE INDEX idx_expenses_currency ON expenses(currency) WHERE deleted_at IS NULL;

COMMENT ON COLUMN expenses.currency IS 'Transaction currency (expense currency)';
COMMENT ON COLUMN expenses.base_currency IS 'Company base currency for reporting';
COMMENT ON COLUMN expenses.exchange_rate IS 'Exchange rate used at expense date';
COMMENT ON COLUMN expenses.base_amount_ht IS 'Amount HT in company base currency';
COMMENT ON COLUMN expenses.base_tax_amount IS 'Tax amount in company base currency';
COMMENT ON COLUMN expenses.base_amount_ttc IS 'Amount TTC in company base currency';

-- ============================================================================
-- PAYMENTS: Add base currency tracking
-- ============================================================================
ALTER TABLE payments 
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'CDF',
ADD COLUMN exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
ADD COLUMN base_amount DECIMAL(15, 2);

-- Update existing payments
UPDATE payments 
SET 
  base_currency = COALESCE(currency, 'CDF'),
  exchange_rate = 1.0,
  base_amount = amount
WHERE base_amount IS NULL;

-- Add index
CREATE INDEX idx_payment_currency ON payments(currency) WHERE deleted_at IS NULL;

COMMENT ON COLUMN payments.currency IS 'Transaction currency (payment currency)';
COMMENT ON COLUMN payments.base_currency IS 'Company base currency for reporting';
COMMENT ON COLUMN payments.exchange_rate IS 'Exchange rate used at payment date';
COMMENT ON COLUMN payments.base_amount IS 'Amount in company base currency';

-- ============================================================================
-- CREDIT NOTES: Add base currency tracking
-- ============================================================================
ALTER TABLE credit_notes 
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'CDF',
ADD COLUMN exchange_rate DECIMAL(18, 8) DEFAULT 1.0,
ADD COLUMN base_amount DECIMAL(15, 2),
ADD COLUMN base_tax_amount DECIMAL(15, 2),
ADD COLUMN base_total_amount DECIMAL(15, 2);

-- Update existing credit notes
UPDATE credit_notes 
SET 
  base_currency = COALESCE(currency, 'CDF'),
  exchange_rate = 1.0,
  base_amount = amount,
  base_tax_amount = tax_amount,
  base_total_amount = total_amount
WHERE base_amount IS NULL;

-- Add index
CREATE INDEX idx_credit_notes_currency ON credit_notes(currency) WHERE deleted_at IS NULL;

COMMENT ON COLUMN credit_notes.currency IS 'Transaction currency';
COMMENT ON COLUMN credit_notes.base_currency IS 'Company base currency for reporting';
COMMENT ON COLUMN credit_notes.exchange_rate IS 'Exchange rate used at credit note date';
COMMENT ON COLUMN credit_notes.base_amount IS 'Amount in company base currency';
COMMENT ON COLUMN credit_notes.base_tax_amount IS 'Tax amount in company base currency';
COMMENT ON COLUMN credit_notes.base_total_amount IS 'Total amount in company base currency';
