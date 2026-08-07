-- backend/migrations/003_audit_logs.sql

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT      REFERENCES users(user_id) ON DELETE SET NULL,
  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   TEXT        NOT NULL,
  changes     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
