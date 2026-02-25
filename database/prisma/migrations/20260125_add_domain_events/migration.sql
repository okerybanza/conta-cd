-- SPRINT 2 - TASK 2.3 (ARCH-001): Centralized Domain Event Log
-- Create the domain_events table for event sourcing foundation

CREATE TABLE IF NOT EXISTS "domain_events" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" TEXT,
    "user_id" TEXT,
    "correlation_id" VARCHAR(100),
    "causation_id" VARCHAR(100),

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "domain_events_company_id_idx" ON "domain_events"("company_id");
CREATE INDEX IF NOT EXISTS "domain_events_entity_id_idx" ON "domain_events"("entity_id");
CREATE INDEX IF NOT EXISTS "domain_events_type_idx" ON "domain_events"("type");
CREATE INDEX IF NOT EXISTS "domain_events_occurred_at_idx" ON "domain_events"("occurred_at");

-- Add foreign key constraint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE domain_events IS 'Persistent store for all domain events (ARCH-001)';
