import { query } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export interface JobRow {
  id: string;
  rudder_id: string;
  action: string;
  params: Record<string, unknown>;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface CreateJobInput {
  rudderId: string;
  action: string;
  params: Record<string, unknown>;
}

export async function create(input: CreateJobInput): Promise<JobRow> {
  const id = uuidv4();
  const result = await query<JobRow>(
    `INSERT INTO jobs (id, rudder_id, action, params, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [id, input.rudderId, input.action, JSON.stringify(input.params)]
  );
  return result.rows[0];
}

export async function findById(id: string): Promise<JobRow | null> {
  const result = await query<JobRow>(
    'SELECT * FROM jobs WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export interface ListJobsFilter {
  status?: string;
  rudderId?: string;
  days?: number;
  page: number;
  limit: number;
}

export async function list(filter: ListJobsFilter): Promise<{ jobs: JobRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filter.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filter.status);
  }

  if (filter.rudderId) {
    conditions.push(`rudder_id = $${paramIndex++}`);
    params.push(filter.rudderId);
  }

  if (filter.days) {
    conditions.push(`created_at >= NOW() - INTERVAL '1 day' * $${paramIndex++}`);
    params.push(filter.days);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (filter.page - 1) * filter.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM jobs ${whereClause}`,
    params
  );

  const result = await query<JobRow>(
    `SELECT * FROM jobs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, filter.limit, offset]
  );

  return {
    jobs: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function updateStatus(
  id: string,
  status: string,
  result?: Record<string, unknown>,
  error?: string
): Promise<JobRow | null> {
  let updateQuery: string;
  let params: unknown[];

  if (status === 'running') {
    updateQuery = `UPDATE jobs SET status = $2, started_at = NOW() WHERE id = $1 RETURNING *`;
    params = [id, status];
  } else if (status === 'done' || status === 'failed') {
    updateQuery = `UPDATE jobs SET status = $2, completed_at = NOW(), result = $3, error = $4 WHERE id = $1 RETURNING *`;
    params = [id, status, result ? JSON.stringify(result) : null, error || null];
  } else {
    updateQuery = `UPDATE jobs SET status = $2 WHERE id = $1 RETURNING *`;
    params = [id, status];
  }

  const queryResult = await query<JobRow>(updateQuery, params);
  return queryResult.rows[0] || null;
}

export async function cleanupOld(retentionDays: number): Promise<number> {
  const result = await query(
    `DELETE FROM jobs 
     WHERE created_at < NOW() - INTERVAL '1 day' * $1 
     AND status IN ('done', 'failed')`,
    [retentionDays]
  );
  return result.rowCount || 0;
}

export async function getPending(rudderId: string): Promise<JobRow[]> {
  const result = await query<JobRow>(
    `SELECT * FROM jobs WHERE rudder_id = $1 AND status = 'pending' ORDER BY created_at ASC`,
    [rudderId]
  );
  return result.rows;
}
