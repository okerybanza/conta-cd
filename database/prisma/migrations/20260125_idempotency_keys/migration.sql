-- SPRINT 1 - TASK 1.6 (CODE-006): Idempotency Framework
-- Table to store idempotency keys for preventing duplicate operations

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_hash TEXT NOT NULL,
  response_code INTEGER NOT NULL,
  response_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_idempotency_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_idempotency_company_key ON idempotency_keys(company_id, key);
CREATE INDEX idx_idempotency_created_at ON idempotency_keys(created_at);
CREATE INDEX idx_idempotency_expires_at ON idempotency_keys(expires_at);

COMMENT ON TABLE idempotency_keys IS 'SPRINT 1 - TASK 1.6: Stores idempotency keys to prevent duplicate operations (24h TTL)';
