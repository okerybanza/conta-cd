-- Create quotations table
CREATE TABLE IF NOT EXISTS "quotations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "quotation_number" VARCHAR(100) NOT NULL,
    "quotation_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "currency" VARCHAR(3) DEFAULT 'CDF',
    "template_id" VARCHAR(50) DEFAULT 'template-1-modern',
    "notes" TEXT,
    "payment_terms" TEXT,
    "footer_text" TEXT,
    "subtotal" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "tax_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "total_amount" NUMERIC(15,2) NOT NULL DEFAULT 0,
    "reference" VARCHAR(255),
    "po_number" VARCHAR(255),
    "shipping_address" TEXT,
    "shipping_city" VARCHAR(100),
    "shipping_country" VARCHAR(100),
    "transport_fees" NUMERIC(15,2) DEFAULT 0,
    "platform_fees" NUMERIC(15,2) DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "invoice_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    
    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- Create quotation_lines table
CREATE TABLE IF NOT EXISTS "quotation_lines" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
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
    
    CONSTRAINT "quotation_lines_pkey" PRIMARY KEY ("id")
);

-- Create indexes (with existence checks to avoid permission errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_company_id_idx') THEN
        CREATE INDEX "quotations_company_id_idx" ON "quotations"("company_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_customer_id_idx') THEN
        CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_status_idx') THEN
        CREATE INDEX "quotations_status_idx" ON "quotations"("status");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_quotation_date_idx') THEN
        CREATE INDEX "quotations_quotation_date_idx" ON "quotations"("quotation_date");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_expiration_date_idx') THEN
        CREATE INDEX "quotations_expiration_date_idx" ON "quotations"("expiration_date");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_deleted_at_idx') THEN
        CREATE INDEX "quotations_deleted_at_idx" ON "quotations"("deleted_at");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_invoice_id_idx') THEN
        CREATE INDEX "quotations_invoice_id_idx" ON "quotations"("invoice_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotations_company_id_quotation_number_key') THEN
        CREATE UNIQUE INDEX "quotations_company_id_quotation_number_key" ON "quotations"("company_id", "quotation_number");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotation_lines_quotation_id_idx') THEN
        CREATE INDEX "quotation_lines_quotation_id_idx" ON "quotation_lines"("quotation_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quotation_lines_product_id_idx') THEN
        CREATE INDEX "quotation_lines_product_id_idx" ON "quotation_lines"("product_id");
    END IF;
END $$;

-- Add foreign keys (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotations_company_id_fkey'
    ) THEN
        ALTER TABLE "quotations" 
        ADD CONSTRAINT "quotations_company_id_fkey" 
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotations_customer_id_fkey'
    ) THEN
        ALTER TABLE "quotations" 
        ADD CONSTRAINT "quotations_customer_id_fkey" 
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotations_created_by_fkey'
    ) THEN
        ALTER TABLE "quotations" 
        ADD CONSTRAINT "quotations_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotations_invoice_id_fkey'
    ) THEN
        ALTER TABLE "quotations" 
        ADD CONSTRAINT "quotations_invoice_id_fkey" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotation_lines_quotation_id_fkey'
    ) THEN
        ALTER TABLE "quotation_lines" 
        ADD CONSTRAINT "quotation_lines_quotation_id_fkey" 
        FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quotation_lines_product_id_fkey'
    ) THEN
        ALTER TABLE "quotation_lines" 
        ADD CONSTRAINT "quotation_lines_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Add quotation prefix and next number to companies table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'quotation_prefix'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "quotation_prefix" VARCHAR(10) DEFAULT 'DEV';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'next_quotation_number'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "next_quotation_number" INTEGER DEFAULT 1;
    END IF;
END $$;

