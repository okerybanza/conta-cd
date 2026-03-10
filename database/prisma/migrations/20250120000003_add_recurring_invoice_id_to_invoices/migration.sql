-- Add recurring_invoice_id to invoices table for tracking generated invoices
ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "recurring_invoice_id" TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "invoices_recurring_invoice_id_idx" ON "invoices"("recurring_invoice_id");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoices_recurring_invoice_id_fkey'
    ) THEN
        ALTER TABLE "invoices"
        ADD CONSTRAINT "invoices_recurring_invoice_id_fkey"
        FOREIGN KEY ("recurring_invoice_id") 
        REFERENCES "recurring_invoices"("id") 
        ON UPDATE CASCADE 
        ON DELETE SET NULL;
    END IF;
END $$;

