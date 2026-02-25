-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "account_id" TEXT;

-- CreateIndex
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'suppliers_account_id_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "suppliers_account_id_idx" ON "suppliers"("account_id");
  END IF;
END $$;

-- AddForeignKey (ignore error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'suppliers_account_id_fkey'
  ) THEN
    ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_account_id_fkey"
      FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


