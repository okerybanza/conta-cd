-- AlterTable
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "transport_fees" DECIMAL(15,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "platform_fees" DECIMAL(15,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "footer_text" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "supplier_name" VARCHAR(255);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "payment_date" DATE;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "amount_ht" DECIMAL(15,2) DEFAULT 0;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "amount_ttc" DECIMAL(15,2) DEFAULT 0;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "mobile_money_provider" VARCHAR(50);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "mobile_money_number" VARCHAR(50);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "transaction_reference" VARCHAR(255);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "check_number" VARCHAR(100);
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "card_last_four" VARCHAR(4);

-- Synchroniser les valeurs existantes pour amount_ht et amount_ttc
UPDATE "expenses" SET "amount_ht" = "amount" WHERE "amount_ht" IS NULL OR "amount_ht" = 0;
UPDATE "expenses" SET "amount_ttc" = "total_amount" WHERE "amount_ttc" IS NULL OR "amount_ttc" = 0;

