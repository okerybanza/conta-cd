-- AlterTable: Add reminder fields to Company
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminders_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_days_before" INTEGER DEFAULT 3;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_days_after" INTEGER DEFAULT 7;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_frequency" VARCHAR(20) DEFAULT 'daily';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "reminder_methods" TEXT[] DEFAULT ARRAY['email']::TEXT[];

-- CreateTable: RecurringInvoice
CREATE TABLE IF NOT EXISTS "recurring_invoices" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "frequency" VARCHAR(20) NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "next_run_date" DATE NOT NULL,
    "last_run_date" DATE,
    "due_date_days" INTEGER DEFAULT 30,
    "currency" VARCHAR(3) DEFAULT 'CDF',
    "reference" VARCHAR(255),
    "po_number" VARCHAR(255),
    "notes" TEXT,
    "payment_terms" TEXT,
    "lines" JSONB NOT NULL,
    "transport_fees" DECIMAL(15,2),
    "platform_fees" DECIMAL(15,2),
    "auto_send" BOOLEAN DEFAULT false,
    "send_to_customer" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "total_generated" INTEGER DEFAULT 0,
    "last_invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recurring_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recurring_invoices_company_id_idx" ON "recurring_invoices"("company_id");
CREATE INDEX IF NOT EXISTS "recurring_invoices_customer_id_idx" ON "recurring_invoices"("customer_id");
CREATE INDEX IF NOT EXISTS "recurring_invoices_is_active_idx" ON "recurring_invoices"("is_active");
CREATE INDEX IF NOT EXISTS "recurring_invoices_next_run_date_idx" ON "recurring_invoices"("next_run_date");
CREATE INDEX IF NOT EXISTS "recurring_invoices_deleted_at_idx" ON "recurring_invoices"("deleted_at");

-- AddForeignKey (idempotent, ne recrée pas la contrainte si elle existe déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recurring_invoices_company_id_fkey'
  ) THEN
    ALTER TABLE "recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recurring_invoices_customer_id_fkey'
  ) THEN
    ALTER TABLE "recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

