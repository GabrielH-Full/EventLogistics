import { db } from './db';

interface AuditParams {
  userId:     number | string | null;
  action:     string;          // ex: 'TICKET_CREATED'
  entityType: string;          // ex: 'tickets'
  entityId:   string;
  before?:    Record<string, unknown> | null;
  after?:     Record<string, unknown> | null;
}

// Fire-and-forget: nunca lanca excecao para o chamador
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userId,
        params.action,
        params.entityType,
        params.entityId,
        JSON.stringify({ before: params.before ?? null, after: params.after ?? null }),
      ]
    );
  } catch (err) {
    console.error('[audit] Falha ao registrar audit_log:', err);
  }
}
