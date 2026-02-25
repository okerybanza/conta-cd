-- Migration: Add ExpenseAttachment table for expense receipts/justificatifs
-- Date: 2025-01-01

CREATE TABLE IF NOT EXISTS "ExpenseAttachment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseAttachment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ExpenseAttachment_expenseId_idx" ON "ExpenseAttachment"("expenseId");
CREATE INDEX IF NOT EXISTS "ExpenseAttachment_companyId_idx" ON "ExpenseAttachment"("companyId");
CREATE INDEX IF NOT EXISTS "ExpenseAttachment_uploadedBy_idx" ON "ExpenseAttachment"("uploadedBy");

-- Foreign keys (with existence checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseAttachment_expenseId_fkey'
    ) THEN
        ALTER TABLE "ExpenseAttachment" 
        ADD CONSTRAINT "ExpenseAttachment_expenseId_fkey" 
        FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseAttachment_companyId_fkey'
    ) THEN
        ALTER TABLE "ExpenseAttachment" 
        ADD CONSTRAINT "ExpenseAttachment_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseAttachment_uploadedBy_fkey'
    ) THEN
        ALTER TABLE "ExpenseAttachment" 
        ADD CONSTRAINT "ExpenseAttachment_uploadedBy_fkey" 
        FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Comments
COMMENT ON TABLE "ExpenseAttachment" IS 'Justificatifs et pièces jointes pour les dépenses';
COMMENT ON COLUMN "ExpenseAttachment"."filename" IS 'Nom unique du fichier sur le serveur';
COMMENT ON COLUMN "ExpenseAttachment"."originalName" IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN "ExpenseAttachment"."url" IS 'URL pour télécharger le fichier';

