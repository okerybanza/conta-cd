-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "movement_type" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "warehouse_id" TEXT,
    "reference" VARCHAR(50),
    "reference_id" TEXT,
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_by_id" TEXT,
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_movements_company_id_idx" ON "stock_movements"("company_id");
CREATE INDEX IF NOT EXISTS "stock_movements_product_id_idx" ON "stock_movements"("product_id");
CREATE INDEX IF NOT EXISTS "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");
CREATE INDEX IF NOT EXISTS "stock_movements_reference_reference_id_idx" ON "stock_movements"("reference", "reference_id");
CREATE INDEX IF NOT EXISTS "stock_movements_created_at_idx" ON "stock_movements"("created_at");
CREATE INDEX IF NOT EXISTS "stock_movements_reversed_at_idx" ON "stock_movements"("reversed_at");

-- CreateIndex (unique pour reversed_by_id)
CREATE UNIQUE INDEX IF NOT EXISTS "stock_movements_reversed_by_id_key" ON "stock_movements"("reversed_by_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stock_movements_product_id_fkey'
    ) THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stock_movements_company_id_fkey'
    ) THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_company_id_fkey" 
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stock_movements_created_by_fkey'
    ) THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stock_movements_reversed_by_id_fkey'
    ) THEN
        ALTER TABLE "stock_movements" 
        ADD CONSTRAINT "stock_movements_reversed_by_id_fkey" 
        FOREIGN KEY ("reversed_by_id") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

