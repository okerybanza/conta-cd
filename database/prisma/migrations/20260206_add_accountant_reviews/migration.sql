-- CreateTable
CREATE TABLE "accountant_reviews" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accountant_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accountant_reviews_accountant_id_idx" ON "accountant_reviews"("accountant_id");

-- CreateIndex
CREATE INDEX "accountant_reviews_rating_idx" ON "accountant_reviews"("rating");

-- CreateIndex (unique constraint: one review per company per accountant)
CREATE UNIQUE INDEX "accountant_reviews_company_id_accountant_id_key" ON "accountant_reviews"("company_id", "accountant_id");

-- AddForeignKey
ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountant_reviews" ADD CONSTRAINT "accountant_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
