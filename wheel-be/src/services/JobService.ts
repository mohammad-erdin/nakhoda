import * as jobQueries from '../db/queries/jobs.js';
import * as jobLogQueries from '../db/queries/jobLogs.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { JobNotFoundError } from '../utils/errors.js';

export interface Job {
  id: string;
  rudderId: string;
  action: string;
  status: string;
  params: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface JobLog {
  id: string;
  jobId: string;
  message: string;
  level: string;
  createdAt: string;
}

export interface JobWithLogs extends Job {
  logs: JobLog[];
}

function mapJobRow(row: jobQueries.JobRow): Job {
  return {
    id: row.id,
    rudderId: row.rudder_id,
    action: row.action,
    status: row.status,
    params: row.params,
    result: row.result || undefined,
    error: row.error || undefined,
    createdAt: row.created_at.toISOString(),
    startedAt: row.started_at?.toISOString(),
    completedAt: row.completed_at?.toISOString(),
  };
}

function mapJobLogRow(row: jobLogQueries.JobLogRow): JobLog {
  return {
    id: row.id,
    jobId: row.job_id,
    message: row.message,
    level: row.level,
    createdAt: row.created_at.toISOString(),
  };
}

export interface CreateJobInput {
  rudderId: string;
  action: string;
  params: Record<string, unknown>;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const row = await jobQueries.create(input);
  logger.info('Job created', { jobId: row.id, action: input.action, rudderId: input.rudderId });
  return mapJobRow(row);
}

export async function getJob(jobId: string): Promise<Job> {
  const row = await jobQueries.findById(jobId);
  if (!row) {
    throw new JobNotFoundError(jobId);
  }
  return mapJobRow(row);
}

export async function getJobWithLogs(jobId: string): Promise<JobWithLogs> {
  const row = await jobQueries.findById(jobId);
  if (!row) {
    throw new JobNotFoundError(jobId);
  }

  const logRows = await jobLogQueries.findByJobId(jobId);
  const logs = logRows.map(mapJobLogRow);

  return {
    ...mapJobRow(row),
    logs,
  };
}

export interface ListJobsFilter {
  status?: string;
  rudderId?: string;
  days?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedJobs {
  items: Job[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listJobs(filter: ListJobsFilter = {}): Promise<PaginatedJobs> {
  const page = filter.page || 1;
  const limit = filter.limit || 50;

  const { jobs, total } = await jobQueries.list({
    status: filter.status,
    rudderId: filter.rudderId,
    days: filter.days,
    page,
    limit,
  });

  return {
    items: jobs.map(mapJobRow),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateJobStatus(
  jobId: string,
  status: 'running' | 'done' | 'failed',
  result?: Record<string, unknown>,
  error?: string
): Promise<Job> {
  const row = await jobQueries.updateStatus(jobId, status, result, error);
  if (!row) {
    throw new JobNotFoundError(jobId);
  }

  logger.info('Job status updated', { jobId, status });
  return mapJobRow(row);
}

export async function addJobLog(
  jobId: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info'
): Promise<JobLog> {
  const row = await jobLogQueries.append(jobId, message, level);
  return mapJobLogRow(row);
}

export async function getPendingJobs(rudderId: string): Promise<Job[]> {
  const rows = await jobQueries.getPending(rudderId);
  return rows.map(mapJobRow);
}

export async function cleanupOldJobs(): Promise<number> {
  const deleted = await jobQueries.cleanupOld(config.job.retentionDays);
  if (deleted > 0) {
    logger.info('Old jobs cleaned up', { deleted, retentionDays: config.job.retentionDays });
  }
  return deleted;
}
