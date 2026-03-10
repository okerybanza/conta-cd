-- SPRINT 2 - TASK 2.1 (ACCT-011, ACCT-012): Immutable Audit Log with Hash Chain
-- This migration adds hash fields and security triggers to the audit_logs table

-- 1. Add hash fields if they don't exist (Prisma might handle this, but explicit is better for the trigger setup)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hash VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);

-- 2. Create function to prevent modifications/deletions on audit_logs
CREATE OR REPLACE FUNCTION protect_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Deletion of audit logs is strictly prohibited (ACCT-011 compliance).' 
            USING ERRCODE = 'P0004';
    ELSIF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Modification of audit logs is strictly prohibited (ACCT-011 compliance).' 
            USING ERRCODE = 'P0005';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to enforce immutability
DROP TRIGGER IF EXISTS enforce_audit_log_immutability ON audit_logs;
CREATE TRIGGER enforce_audit_log_immutability
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION protect_audit_log_immutability();

-- 4. Add comments
COMMENT ON COLUMN audit_logs.hash IS 'SHA-256 hash of the entry content + previous_hash (ACCT-012)';
COMMENT ON COLUMN audit_logs.previous_hash IS 'Hash of the immediately preceding audit log entry (ACCT-012)';
