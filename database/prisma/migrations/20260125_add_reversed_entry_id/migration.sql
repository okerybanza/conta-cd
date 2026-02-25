-- SPRINT 1 - TASK 1.3 (ARCH-010): Add reversed_entry_id for journal entry immutability
-- This field links a reversed journal entry to its compensating reversal entry

-- Add reversed_entry_id column
ALTER TABLE "journal_entries" 
ADD COLUMN "reversed_entry_id" VARCHAR(255);

-- Add index for performance
CREATE INDEX "journal_entries_reversed_entry_id_idx" ON "journal_entries"("reversed_entry_id");

-- Add foreign key constraint (self-referential)
ALTER TABLE "journal_entries"
ADD CONSTRAINT "journal_entries_reversed_entry_id_fkey" 
FOREIGN KEY ("reversed_entry_id") REFERENCES "journal_entries"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
