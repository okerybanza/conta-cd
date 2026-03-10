-- SPRINT 1 - TASK 1.5 (ACCT-008): Fiscal Period Enforcement at Database Level
-- This trigger ensures journal entries cannot be created/modified in closed or locked fiscal periods

-- Function to validate fiscal period before insert/update on journal_entries
CREATE OR REPLACE FUNCTION validate_fiscal_period_for_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_period RECORD;
    v_entry_date DATE;
BEGIN
    -- Get the entry date (for both INSERT and UPDATE)
    IF TG_OP = 'INSERT' THEN
        v_entry_date := NEW.entry_date;
    ELSIF TG_OP = 'UPDATE' THEN
        v_entry_date := NEW.entry_date;
    END IF;

    -- Find the fiscal period for this date
    SELECT * INTO v_period
    FROM fiscal_periods
    WHERE company_id = NEW.company_id
      AND start_date <= v_entry_date
      AND end_date >= v_entry_date
    LIMIT 1;

    -- If no period found, reject
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No fiscal period found for date %. Cannot create/modify journal entry.', 
            v_entry_date
            USING ERRCODE = 'P0001';
    END IF;

    -- If period is closed, reject
    IF v_period.status = 'closed' THEN
        RAISE EXCEPTION 'Fiscal period "%" is closed. Cannot create/modify journal entries.', 
            v_period.name
            USING ERRCODE = 'P0002';
    END IF;

    -- If period is locked, reject
    IF v_period.status = 'locked' THEN
        RAISE EXCEPTION 'Fiscal period "%" is locked. Cannot create/modify journal entries.', 
            v_period.name
            USING ERRCODE = 'P0003';
    END IF;

    -- Period is open, allow the operation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS enforce_fiscal_period_on_insert ON journal_entries;
CREATE TRIGGER enforce_fiscal_period_on_insert
    BEFORE INSERT ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION validate_fiscal_period_for_journal_entry();

-- Create trigger for UPDATE operations (when entry_date changes)
DROP TRIGGER IF EXISTS enforce_fiscal_period_on_update ON journal_entries;
CREATE TRIGGER enforce_fiscal_period_on_update
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    WHEN (OLD.entry_date IS DISTINCT FROM NEW.entry_date OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_fiscal_period_for_journal_entry();

-- Add comment for documentation
COMMENT ON FUNCTION validate_fiscal_period_for_journal_entry() IS 
'SPRINT 1 - TASK 1.5: Enforces fiscal period rules at database level. Prevents journal entries in closed/locked periods.';
