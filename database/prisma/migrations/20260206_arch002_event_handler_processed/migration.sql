-- ARCH-002: Idempotence des handlers d'événements (replay / double livraison)
-- Une ligne par (event_id, handler_name) = événement déjà traité par ce handler

CREATE TABLE IF NOT EXISTS event_handler_processed (
  event_id     VARCHAR(255) NOT NULL,
  handler_name VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, handler_name)
);

CREATE INDEX IF NOT EXISTS idx_event_handler_processed_handler ON event_handler_processed(handler_name);

COMMENT ON TABLE event_handler_processed IS 'ARCH-002: Event handlers idempotency - skip duplicate/replay processing';
