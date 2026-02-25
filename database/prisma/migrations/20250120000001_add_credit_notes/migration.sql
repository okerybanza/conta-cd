-- Create credit_notes table
CREATE TABLE IF NOT EXISTS "credit_notes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "credit_note_number" VARCHAR(100) NOT NULL,
    "credit_note_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" NUMERIC(15,2) NOT NULL,
    "tax_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "total_amount" NUMERIC(15,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "reason" TEXT,
    "reference" VARCHAR(255),
    "currency" VARCHAR(3) DEFAULT 'CDF',
    "template_id" VARCHAR(50) DEFAULT 'template-1-modern',
    "notes" TEXT,
    "footer_text" TEXT,
    "applied_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "applied_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    
    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- Create indexes (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_company_id_idx') THEN
        CREATE INDEX "credit_notes_company_id_idx" ON "credit_notes"("company_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_invoice_id_idx') THEN
        CREATE INDEX "credit_notes_invoice_id_idx" ON "credit_notes"("invoice_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_status_idx') THEN
        CREATE INDEX "credit_notes_status_idx" ON "credit_notes"("status");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_credit_note_date_idx') THEN
        CREATE INDEX "credit_notes_credit_note_date_idx" ON "credit_notes"("credit_note_date");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_deleted_at_idx') THEN
        CREATE INDEX "credit_notes_deleted_at_idx" ON "credit_notes"("deleted_at");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'credit_notes_company_id_credit_note_number_key') THEN
        CREATE UNIQUE INDEX "credit_notes_company_id_credit_note_number_key" ON "credit_notes"("company_id", "credit_note_number");
    END IF;
END $$;

-- Add foreign keys (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'credit_notes_company_id_fkey'
    ) THEN
        ALTER TABLE "credit_notes" 
        ADD CONSTRAINT "credit_notes_company_id_fkey" 
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'credit_notes_invoice_id_fkey'
    ) THEN
        ALTER TABLE "credit_notes" 
        ADD CONSTRAINT "credit_notes_invoice_id_fkey" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'credit_notes_created_by_fkey'
    ) THEN
        ALTER TABLE "credit_notes" 
        ADD CONSTRAINT "credit_notes_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Add credit note prefix and next number to companies table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'credit_note_prefix'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "credit_note_prefix" VARCHAR(10) DEFAULT 'AV';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'next_credit_note_number'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "next_credit_note_number" INTEGER DEFAULT 1;
    END IF;
END $$;

