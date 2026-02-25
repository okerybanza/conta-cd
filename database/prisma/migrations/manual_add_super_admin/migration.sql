-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "is_system_company" BOOLEAN DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "system_type" VARCHAR(50);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "companies_is_system_company_idx" ON "companies"("is_system_company");
CREATE INDEX IF NOT EXISTS "companies_system_type_idx" ON "companies"("system_type");
