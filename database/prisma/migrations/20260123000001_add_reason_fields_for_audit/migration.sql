-- Add reason field to audit_logs
ALTER TABLE "audit_logs" ADD COLUMN "reason" VARCHAR(500);

-- Add reason field to expenses
ALTER TABLE "expenses" ADD COLUMN "reason" VARCHAR(500);

-- Add reason field to invoices  
ALTER TABLE "invoices" ADD COLUMN "reason" VARCHAR(500);

-- Add reason field to payments
ALTER TABLE "payments" ADD COLUMN "reason" VARCHAR(500);

-- Add reason field to journal_entries
ALTER TABLE "journal_entries" ADD COLUMN "reason" VARCHAR(500);

-- Note: credit_notes already had a reason field
