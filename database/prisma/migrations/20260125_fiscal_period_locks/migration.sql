-- SPRINT 1 - TASK 1.5: Fiscal Period Hard Locks (Trigger-based)

-- 1. Create the verification function
CREATE OR REPLACE FUNCTION check_fiscal_period_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_target_date DATE;
    v_company_id TEXT;
    v_status VARCHAR(50);
    v_period_name VARCHAR(255);
BEGIN
    -- Determine the target date and company based on the table
    CASE TG_TABLE_NAME
        WHEN 'journal_entries' THEN
            v_target_date := NEW.entry_date;
            v_company_id := NEW.company_id;
        WHEN 'invoices' THEN
            v_target_date := NEW.invoice_date;
            v_company_id := NEW.company_id; -- Note: fixed case
        WHEN 'expenses' THEN
            v_target_date := NEW.expense_date;
            v_company_id := NEW.company_id;
        WHEN 'payments' THEN
            v_target_date := NEW.payment_date;
            v_company_id := NEW.company_id;
        WHEN 'credit_notes' THEN
            v_target_date := NEW.credit_note_date;
            v_company_id := NEW.company_id;
        ELSE
            RETURN NEW;
    END CASE;

    -- For DELETE operations, we need to check the OLD record
    IF (TG_OP = 'DELETE') THEN
        CASE TG_TABLE_NAME
            WHEN 'journal_entries' THEN
                v_target_date := OLD.entry_date;
                v_company_id := OLD.company_id;
            WHEN 'invoices' THEN
                v_target_date := OLD.invoice_date;
                v_company_id := OLD.company_id;
            WHEN 'expenses' THEN
                v_target_date := OLD.expense_date;
                v_company_id := OLD.company_id;
            WHEN 'payments' THEN
                v_target_date := OLD.payment_date;
                v_company_id := OLD.company_id;
            WHEN 'credit_notes' THEN
                v_target_date := OLD.credit_note_date;
                v_company_id := OLD.company_id;
        END CASE;
    END IF;

    -- Look up the fiscal period status
    SELECT status, name INTO v_status, v_period_name
    FROM fiscal_periods
    WHERE company_id = v_company_id
      AND start_date <= v_target_date
      AND end_date >= v_target_date
    LIMIT 1;

    -- If no period is found, we block (Safety First policy)
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'No fiscal period defined for date % (Company: %). All financial transactions must be within a valid fiscal period.', v_target_date, v_company_id 
        USING ERRCODE = 'P0001'; -- Custom error code for "Missing Fiscal Period"
    END IF;

    -- Check if period is closed or locked
    IF v_status IN ('closed', 'locked') THEN
        RAISE EXCEPTION 'L''exercice comptable "%" est % (Status: %). Aucune modification n''est autorisée pour la date %.', v_period_name, 
            CASE WHEN v_status = 'closed' THEN 'clos' ELSE 'verrouillé' END,
            v_status, v_target_date
        USING ERRCODE = 'P0002'; -- Custom error code for "Locked Fiscal Period"
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Clean up legacy triggers if they exist
DROP TRIGGER IF EXISTS enforce_fiscal_period_on_insert ON journal_entries;
DROP TRIGGER IF EXISTS enforce_fiscal_period_on_update ON journal_entries;

-- 3. Apply triggers to financial tables

-- Journal Entries
DROP TRIGGER IF EXISTS trg_check_fp_journal_entries ON journal_entries;
CREATE TRIGGER trg_check_fp_journal_entries
BEFORE INSERT OR UPDATE OR DELETE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION check_fiscal_period_lock();

-- Invoices
DROP TRIGGER IF EXISTS trg_check_fp_invoices ON invoices;
CREATE TRIGGER trg_check_fp_invoices
BEFORE INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION check_fiscal_period_lock();

-- Expenses
DROP TRIGGER IF EXISTS trg_check_fp_expenses ON expenses;
CREATE TRIGGER trg_check_fp_expenses
BEFORE INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION check_fiscal_period_lock();

-- Payments
DROP TRIGGER IF EXISTS trg_check_fp_payments ON payments;
CREATE TRIGGER trg_check_fp_payments
BEFORE INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION check_fiscal_period_lock();

-- Credit Notes
DROP TRIGGER IF EXISTS trg_check_fp_credit_notes ON credit_notes;
CREATE TRIGGER trg_check_fp_credit_notes
BEFORE INSERT OR UPDATE OR DELETE ON credit_notes
FOR EACH ROW EXECUTE FUNCTION check_fiscal_period_lock();
