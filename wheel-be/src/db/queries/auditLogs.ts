import { query } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  rudder_id: string | null;
  action: string;
  status: string;
  params: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  ip_address: string | null;
  created_at: Date;
}

export interface CreateAuditLogInput {
  userId?: string;
  rudderId?: string;
  action: string;
  status: 'success' | 'failed';
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  ipAddress?: string;
}

export async function create(input: CreateAuditLogInput): Promise<AuditLogRow> {
  const id = uuidv4();
  const result = await query<AuditLogRow>(
    `INSERT INTO audit_logs (id, user_id, rudder_id, action, status, params, result, error, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      input.userId || null,
      input.rudderId || null,
      input.action,
      input.status,
      input.params ? JSON.stringify(input.params) : null,
      input.result ? JSON.stringify(input.result) : null,
      input.error || null,
      input.ipAddress || null,
    ]
  );
  return result.rows[0];
}

export interface ListAuditLogsFilter {
  userId?: string;
  rudderId?: string;
  status?: 'success' | 'failed';
  days?: number;
  page: number;
  limit: number;
}

export async function list(filter: ListAuditLogsFilter): Promise<{ logs: AuditLogRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(filter.userId);
  }

  if (filter.rudderId) {
    conditions.push(`rudder_id = $${paramIndex++}`);
    params.push(filter.rudderId);
  }

  if (filter.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filter.status);
  }

  if (filter.days) {
    conditions.push(`created_at >= NOW() - INTERVAL '1 day' * $${paramIndex++}`);
    params.push(filter.days);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (filter.page - 1) * filter.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
    params
  );

  const result = await query<AuditLogRow>(
    `SELECT * FROM audit_logs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, filter.limit, offset]
  );

  return {
    logs: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}
