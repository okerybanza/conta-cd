-- CreateExtension
-- Add VARCHAR constraint to credit_notes.reason field
-- Migration: add_varchar_constraint_to_credit_notes_reason
-- Date: 2026-01-25

BEGIN;

-- Alter credit_notes table to add VARCHAR(500) constraint to reason column
ALTER TABLE "credit_notes" ALTER COLUMN "reason" TYPE VARCHAR(500);

COMMIT;
