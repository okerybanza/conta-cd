-- Add profile photo and avatar columns (fixes 500 on GET /accountants/profile and related)
-- Run with: psql $DATABASE_URL -f database/prisma/migrations/20260217000000_add_profile_photo_and_avatar/migration.sql

ALTER TABLE "user_accountant_profiles"
  ADD COLUMN IF NOT EXISTS "profile_photo_url" VARCHAR(500);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(500);
