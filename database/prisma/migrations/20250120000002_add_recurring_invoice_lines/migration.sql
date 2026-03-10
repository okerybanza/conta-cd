-- Create recurring_invoice_lines table
CREATE TABLE IF NOT EXISTS "recurring_invoice_lines" (
    "id" TEXT NOT NULL,
    "recurring_invoice_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" NUMERIC(15,2) NOT NULL DEFAULT 1,
    "unit_price" NUMERIC(15,2) NOT NULL,
    "tax_rate" NUMERIC(5,2) NOT NULL DEFAULT 0,
    "tax_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "subtotal" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "total" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "recurring_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- Create indexes (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'recurring_invoice_lines_recurring_invoice_id_idx') THEN
        CREATE INDEX "recurring_invoice_lines_recurring_invoice_id_idx" ON "recurring_invoice_lines"("recurring_invoice_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'recurring_invoice_lines_product_id_idx') THEN
        CREATE INDEX "recurring_invoice_lines_product_id_idx" ON "recurring_invoice_lines"("product_id");
    END IF;
END $$;

-- Add foreign keys (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recurring_invoice_lines_recurring_invoice_id_fkey'
    ) THEN
        ALTER TABLE "recurring_invoice_lines" 
        ADD CONSTRAINT "recurring_invoice_lines_recurring_invoice_id_fkey" 
        FOREIGN KEY ("recurring_invoice_id") REFERENCES "recurring_invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recurring_invoice_lines_product_id_fkey'
    ) THEN
        ALTER TABLE "recurring_invoice_lines" 
        ADD CONSTRAINT "recurring_invoice_lines_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;


