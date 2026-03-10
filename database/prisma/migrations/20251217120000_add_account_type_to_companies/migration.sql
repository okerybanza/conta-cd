-- Migration: ajouter le type de compte fonctionnel (account_type) sur les entreprises
-- Enum AccountType déjà déclaré dans schema.prisma

DO $$
BEGIN
  -- Créer le type enum AccountType s'il n'existe pas encore
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountType') THEN
    CREATE TYPE "AccountType" AS ENUM ('ENTREPRENEUR', 'STARTUP', 'ONG_FIRM', 'EXPERT_COMPTABLE');
  END IF;

  -- Ajouter la colonne account_type à la table companies si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'account_type'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "account_type" "AccountType" NOT NULL DEFAULT 'STARTUP';
  END IF;
END $$;


