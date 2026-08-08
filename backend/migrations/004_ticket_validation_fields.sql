-- Migration: 004_ticket_validation_fields.sql
-- Description: Adiciona status 'reverted' e colunas de rastreio (operator_id, stall_id) na tabela tickets.

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('pending', 'validated', 'reverted'));

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS operator_id BIGINT REFERENCES users(user_id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS stall_id TEXT REFERENCES stalls(stall_id);
