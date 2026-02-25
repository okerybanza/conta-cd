-- Add profile fields: bio, certifications, languages, linkedin_url, business_hours
-- Run this on the server if GET /accountants/profile returns 500 (columns missing).

ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT '{}';
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT '{}';
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" VARCHAR(500);
ALTER TABLE "user_accountant_profiles" ADD COLUMN IF NOT EXISTS "business_hours" VARCHAR(255);
