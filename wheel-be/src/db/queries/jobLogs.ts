import { query } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export interface JobLogRow {
  id: string;
  job_id: string;
  message: string;
  level: string;
  created_at: Date;
}

export async function append(
	jobId: string,
	message: string,
	level: 'info' | 'warn' | 'error' = 'info'
): Promise<JobLogRow> {
	const id = uuidv4();
	const result = await query<JobLogRow>(
		`INSERT INTO job_logs (id, job_id, message, level)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
		[id, jobId, message, level]
	);
	return result.rows[0];
}

export async function findByJobId(jobId: string): Promise<JobLogRow[]> {
	const result = await query<JobLogRow>(
		`SELECT * FROM job_logs WHERE job_id = $1 ORDER BY created_at ASC`,
		[jobId]
	);
	return result.rows;
}

export async function deleteByJobId(jobId: string): Promise<number> {
	const result = await query(
		`DELETE FROM job_logs WHERE job_id = $1`,
		[jobId]
	);
	return result.rowCount || 0;
}
