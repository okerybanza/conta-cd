-- Migration: Add datarissage fields and company_datarissage_settings table
-- This migration adds the datarissage (onboarding) system with locked fields

-- Add datarissage fields to companies table
ALTER TABLE "companies" 
ADD COLUMN IF NOT EXISTS "datarissage_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "datarissage_completed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Africa/Kinshasa',
ADD COLUMN IF NOT EXISTS "business_type" TEXT,
ADD COLUMN IF NOT EXISTS "module_facturation_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "module_comptabilite_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "module_stock_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "module_rh_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "stock_management_type" TEXT,
ADD COLUMN IF NOT EXISTS "stock_tracking_type" TEXT,
ADD COLUMN IF NOT EXISTS "stock_allow_negative" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "stock_valuation_method" TEXT,
ADD COLUMN IF NOT EXISTS "rh_organization_type" TEXT,
ADD COLUMN IF NOT EXISTS "rh_payroll_enabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "rh_payroll_cycle" TEXT,
ADD COLUMN IF NOT EXISTS "rh_accounting_integration" BOOLEAN DEFAULT false;

-- Create company_datarissage_settings table
CREATE TABLE IF NOT EXISTS "company_datarissage_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "currency_locked" BOOLEAN NOT NULL DEFAULT false,
    "business_type_locked" BOOLEAN NOT NULL DEFAULT false,
    "stock_management_type_locked" BOOLEAN NOT NULL DEFAULT false,
    "stock_valuation_method_locked" BOOLEAN NOT NULL DEFAULT false,
    "rh_payroll_enabled_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_datarissage_settings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on company_id
CREATE UNIQUE INDEX IF NOT EXISTS "company_datarissage_settings_company_id_key" 
ON "company_datarissage_settings"("company_id");

-- Create index on company_id
CREATE INDEX IF NOT EXISTS "company_datarissage_settings_company_id_idx" 
ON "company_datarissage_settings"("company_id");

-- Add foreign key constraint to companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_datarissage_settings_company_id_fkey'
    ) THEN
        ALTER TABLE "company_datarissage_settings"
        ADD CONSTRAINT "company_datarissage_settings_company_id_fkey"
        FOREIGN KEY ("company_id") 
        REFERENCES "companies"("id") 
        ON UPDATE CASCADE 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN "companies"."datarissage_completed" IS 'Indicates if the datarissage (onboarding) process is completed';
COMMENT ON COLUMN "companies"."business_type" IS 'Type of business: commerce, services, production, logistique, ong, multi_activite';
COMMENT ON COLUMN "companies"."module_stock_enabled" IS 'Stock module activation status';
COMMENT ON COLUMN "companies"."module_rh_enabled" IS 'HR module activation status';
COMMENT ON COLUMN "companies"."stock_management_type" IS 'Stock management type: simple, multi_warehouses';
COMMENT ON COLUMN "companies"."stock_tracking_type" IS 'Stock tracking type: quantity, lots, serial_numbers';
COMMENT ON COLUMN "companies"."stock_valuation_method" IS 'Stock valuation method: fifo, weighted_average';
COMMENT ON COLUMN "companies"."rh_organization_type" IS 'HR organization type: simple, departmental, multi_entity';
COMMENT ON COLUMN "companies"."rh_payroll_cycle" IS 'Payroll cycle: monthly, other';

