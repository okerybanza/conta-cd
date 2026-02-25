-- CreateTable: Depreciation
CREATE TABLE IF NOT EXISTS "depreciations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "asset_account_id" TEXT NOT NULL,
    "depreciation_account_id" TEXT NOT NULL,
    "asset_name" VARCHAR(255) NOT NULL,
    "acquisition_date" DATE NOT NULL,
    "acquisition_cost" DECIMAL(15,2) NOT NULL,
    "depreciation_method" VARCHAR(50) NOT NULL,
    "depreciation_rate" DECIMAL(5,2),
    "useful_life" INTEGER NOT NULL,
    "monthly_depreciation" DECIMAL(15,2) NOT NULL,
    "accumulated_depreciation" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depreciations_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "depreciations_company_id_idx" ON "depreciations"("company_id");
CREATE INDEX IF NOT EXISTS "depreciations_is_active_idx" ON "depreciations"("is_active");
CREATE INDEX IF NOT EXISTS "depreciations_asset_account_id_idx" ON "depreciations"("asset_account_id");
CREATE INDEX IF NOT EXISTS "depreciations_depreciation_account_id_idx" ON "depreciations"("depreciation_account_id");

-- Foreign keys (idempotents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'depreciations_company_id_fkey'
  ) THEN
    ALTER TABLE "depreciations"
    ADD CONSTRAINT "depreciations_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'depreciations_asset_account_id_fkey'
  ) THEN
    ALTER TABLE "depreciations"
    ADD CONSTRAINT "depreciations_asset_account_id_fkey"
    FOREIGN KEY ("asset_account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'depreciations_depreciation_account_id_fkey'
  ) THEN
    ALTER TABLE "depreciations"
    ADD CONSTRAINT "depreciations_depreciation_account_id_fkey"
    FOREIGN KEY ("depreciation_account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


