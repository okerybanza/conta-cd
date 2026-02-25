-- ACCT-006: Workflow d'approbation générique (fondation)
CREATE TABLE IF NOT EXISTS approval_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type      VARCHAR(50) NOT NULL,
  entity_id        VARCHAR(255) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by     VARCHAR(255) NOT NULL REFERENCES users(id),
  requested_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_by      VARCHAR(255) REFERENCES users(id),
  approved_at      TIMESTAMP,
  rejected_by      VARCHAR(255) REFERENCES users(id),
  rejected_at      TIMESTAMP,
  rejection_reason VARCHAR(500),
  comments         VARCHAR(1000),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);

COMMENT ON TABLE approval_requests IS 'ACCT-006: Generic approval workflow - request/approve/reject any entity';
