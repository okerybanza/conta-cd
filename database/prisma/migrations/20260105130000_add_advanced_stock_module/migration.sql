-- Migration: Module Stock Avancé (DOC-03)
-- Date: 2026-01-05

-- 1. Supprimer l'ancienne structure stock_movements (si elle existe)
-- Note: Cette migration suppose que stock_movements existe déjà avec l'ancienne structure
-- On va la modifier pour la nouvelle structure DOC-03

-- 2. Créer la table warehouses
CREATE TABLE IF NOT EXISTS "warehouses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- 3. Créer la table batches (lots)
CREATE TABLE IF NOT EXISTS "batches" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "expiry_date" DATE,
    "production_date" DATE,
    "supplier_batch" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- 4. Modifier stock_movements pour la nouvelle structure DOC-03
-- Supprimer les colonnes obsolètes et ajouter les nouvelles
DO $$
BEGIN
    -- Ajouter status si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'status') THEN
        ALTER TABLE "stock_movements" ADD COLUMN "status" VARCHAR(20) DEFAULT 'DRAFT';
    END IF;

    -- Ajouter validated_by si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'validated_by') THEN
        ALTER TABLE "stock_movements" ADD COLUMN "validated_by" TEXT;
    END IF;

    -- Ajouter validated_at si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'validated_at') THEN
        ALTER TABLE "stock_movements" ADD COLUMN "validated_at" TIMESTAMP(3);
    END IF;

    -- Renommer reversed_by_id en reversed_from_id si nécessaire
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stock_movements' AND column_name = 'reversed_by_id') THEN
        ALTER TABLE "stock_movements" RENAME COLUMN "reversed_by_id" TO "reversed_from_id";
    END IF;

    -- Ajouter reversed_from_id si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'reversed_from_id') THEN
        ALTER TABLE "stock_movements" ADD COLUMN "reversed_from_id" TEXT;
    END IF;

    -- Supprimer product_id, quantity, warehouse_id (maintenant dans items)
    -- Note: On ne supprime pas pour éviter de perdre des données, on les laisse pour migration progressive
END $$;

-- 5. Créer la table stock_movement_items
CREATE TABLE IF NOT EXISTS "stock_movement_items" (
    "id" TEXT NOT NULL,
    "stock_movement_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "warehouse_to_id" TEXT,
    "quantity" DECIMAL(15,2) NOT NULL,
    "batch_id" TEXT,
    "serial_number" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_items_pkey" PRIMARY KEY ("id")
);

-- Indexes pour warehouses
CREATE INDEX IF NOT EXISTS "warehouses_company_id_idx" ON "warehouses"("company_id");
CREATE INDEX IF NOT EXISTS "warehouses_deleted_at_idx" ON "warehouses"("deleted_at");
CREATE INDEX IF NOT EXISTS "warehouses_is_active_idx" ON "warehouses"("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "warehouses_company_id_code_key" ON "warehouses"("company_id", "code") WHERE "code" IS NOT NULL;

-- Indexes pour batches
CREATE INDEX IF NOT EXISTS "batches_company_id_idx" ON "batches"("company_id");
CREATE INDEX IF NOT EXISTS "batches_product_id_idx" ON "batches"("product_id");
CREATE INDEX IF NOT EXISTS "batches_expiry_date_idx" ON "batches"("expiry_date");
CREATE UNIQUE INDEX IF NOT EXISTS "batches_company_id_product_id_batch_number_key" ON "batches"("company_id", "product_id", "batch_number");

-- Indexes pour stock_movement_items
CREATE INDEX IF NOT EXISTS "stock_movement_items_stock_movement_id_idx" ON "stock_movement_items"("stock_movement_id");
CREATE INDEX IF NOT EXISTS "stock_movement_items_product_id_idx" ON "stock_movement_items"("product_id");
CREATE INDEX IF NOT EXISTS "stock_movement_items_warehouse_id_idx" ON "stock_movement_items"("warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_movement_items_batch_id_idx" ON "stock_movement_items"("batch_id");
CREATE INDEX IF NOT EXISTS "stock_movement_items_serial_number_idx" ON "stock_movement_items"("serial_number");

-- Indexes supplémentaires pour stock_movements
CREATE INDEX IF NOT EXISTS "stock_movements_status_idx" ON "stock_movements"("status");
CREATE INDEX IF NOT EXISTS "stock_movements_validated_at_idx" ON "stock_movements"("validated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_movements_reversed_from_id_key" ON "stock_movements"("reversed_from_id") WHERE "reversed_from_id" IS NOT NULL;

-- Foreign keys pour warehouses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouses_company_id_fkey') THEN
        ALTER TABLE "warehouses" 
        ADD CONSTRAINT "warehouses_company_id_fkey" 
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign keys pour batches
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batches_company_id_fkey') THEN
        ALTER TABLE "batches" 
        ADD CONSTRAINT "batches_company_id_fkey" 
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batches_product_id_fkey') THEN
        ALTER TABLE "batches" 
        ADD CONSTRAINT "batches_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign keys pour stock_movement_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movement_items_stock_movement_id_fkey') THEN
        ALTER TABLE "stock_movement_items" 
        ADD CONSTRAINT "stock_movement_items_stock_movement_id_fkey" 
        FOREIGN KEY ("stock_movement_id") REFERENCES "stock_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movement_items_product_id_fkey') THEN
        ALTER TABLE "stock_movement_items" 
        ADD CONSTRAINT "stock_movement_items_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movement_items_warehouse_id_fkey') THEN
        ALTER TABLE "stock_movement_items" 
        ADD CONSTRAINT "stock_movement_items_warehouse_id_fkey" 
        FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movement_items_batch_id_fkey') THEN
        ALTER TABLE "stock_movement_items" 
        ADD CONSTRAINT "stock_movement_items_batch_id_fkey" 
        FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign keys pour stock_movements (nouvelles relations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_validated_by_fkey') THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_validated_by_fkey" 
        FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_reversed_from_id_fkey') THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_reversed_from_id_fkey" 
        FOREIGN KEY ("reversed_from_id") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Marquer tous les mouvements existants comme VALIDATED (pour migration)
UPDATE "stock_movements" SET "status" = 'VALIDATED' WHERE "status" IS NULL;

