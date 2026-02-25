-- À exécuter manuellement sur la base (ex: psql ou outil SQL) si
-- GET /api/v1/accountants/profile renvoie 500 (colonnes absentes).
-- PostgreSQL 9.5+ (IF NOT EXISTS sur ADD COLUMN : 9.5+).

ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT '{}';
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT '{}';
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" VARCHAR(500);
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "business_hours" VARCHAR(255);
