"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const db_1 = require("./db");
// Fire-and-forget: nunca lanca excecao para o chamador
async function logAudit(params) {
    try {
        await db_1.db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`, [
            params.userId,
            params.action,
            params.entityType,
            params.entityId,
            JSON.stringify({ before: params.before ?? null, after: params.after ?? null }),
        ]);
    }
    catch (err) {
        console.error('[audit] Falha ao registrar audit_log:', err);
    }
}
