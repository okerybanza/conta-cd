-- Migration: Add Expense Approval Workflow
-- Date: 2025-01-01

-- Table pour les règles d'approbation par entreprise
CREATE TABLE IF NOT EXISTS "ExpenseApprovalRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "amountThreshold" DECIMAL(10,2), -- Seuil de montant (si null, pas de seuil)
    "categoryId" TEXT, -- Catégorie spécifique (si null, toutes catégories)
    "requireJustificatif" BOOLEAN NOT NULL DEFAULT false,
    "approvers" JSONB NOT NULL DEFAULT '[]', -- Liste des IDs d'approbateurs
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApprovalRule_pkey" PRIMARY KEY ("id")
);

-- Table pour l'historique d'approbation
CREATE TABLE IF NOT EXISTS "ExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT, -- Règle qui a déclenché l'approbation
    "status" TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'cancelled'
    "requestedBy" TEXT NOT NULL, -- ID de l'utilisateur qui a demandé l'approbation
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT, -- ID de l'approbateur
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT, -- ID de celui qui a rejeté
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT, -- Raison du rejet
    "comments" TEXT, -- Commentaires de l'approbateur
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ExpenseApprovalRule_companyId_idx" ON "ExpenseApprovalRule"("companyId");
CREATE INDEX IF NOT EXISTS "ExpenseApprovalRule_enabled_idx" ON "ExpenseApprovalRule"("enabled");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_expenseId_idx" ON "ExpenseApproval"("expenseId");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_companyId_idx" ON "ExpenseApproval"("companyId");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_status_idx" ON "ExpenseApproval"("status");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_requestedBy_idx" ON "ExpenseApproval"("requestedBy");
CREATE INDEX IF NOT EXISTS "ExpenseApproval_approvedBy_idx" ON "ExpenseApproval"("approvedBy");

-- Foreign keys (with existence checks and correct table names)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApprovalRule_companyId_fkey'
    ) THEN
        ALTER TABLE "ExpenseApprovalRule" 
        ADD CONSTRAINT "ExpenseApprovalRule_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApprovalRule_categoryId_fkey'
    ) THEN
        ALTER TABLE "ExpenseApprovalRule" 
        ADD CONSTRAINT "ExpenseApprovalRule_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_expenseId_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" 
        FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_companyId_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_ruleId_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_ruleId_fkey" 
        FOREIGN KEY ("ruleId") REFERENCES "ExpenseApprovalRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_requestedBy_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_requestedBy_fkey" 
        FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_approvedBy_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_approvedBy_fkey" 
        FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExpenseApproval_rejectedBy_fkey'
    ) THEN
        ALTER TABLE "ExpenseApproval" 
        ADD CONSTRAINT "ExpenseApproval_rejectedBy_fkey" 
        FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Ajouter colonne approvalRequired dans expenses
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "approvalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT; -- 'pending', 'approved', 'rejected'

-- Indexes pour expenses
CREATE INDEX IF NOT EXISTS "expenses_approvalRequired_idx" ON "expenses"("approvalRequired");
CREATE INDEX IF NOT EXISTS "expenses_approvalStatus_idx" ON "expenses"("approvalStatus");

-- Comments
COMMENT ON TABLE "ExpenseApprovalRule" IS 'Règles d''approbation des dépenses par entreprise';
COMMENT ON TABLE "ExpenseApproval" IS 'Historique des approbations de dépenses';
COMMENT ON COLUMN "ExpenseApprovalRule"."amountThreshold" IS 'Seuil de montant TTC déclenchant l''approbation (null = pas de seuil)';
COMMENT ON COLUMN "ExpenseApprovalRule"."approvers" IS 'Array JSON des IDs d''utilisateurs approbateurs';
COMMENT ON COLUMN "ExpenseApproval"."status" IS 'Statut: pending, approved, rejected, cancelled';

