import * as auditLogQueries from '../db/queries/auditLogs.js';
import { logger } from '../utils/logger.js';

export interface AuditLog {
  id: string;
  userId: string | null;
  rudderId: string | null;
  action: string;
  status: 'success' | 'failed';
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  ipAddress?: string;
  createdAt: string;
}

function mapAuditLogRow(row: auditLogQueries.AuditLogRow): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    rudderId: row.rudder_id,
    action: row.action,
    status: row.status as 'success' | 'failed',
    params: row.params || undefined,
    result: row.result || undefined,
    error: row.error || undefined,
    ipAddress: row.ip_address || undefined,
    createdAt: row.created_at.toISOString(),
  };
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

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const row = await auditLogQueries.create(input);
  logger.debug('Audit log created', { action: input.action, status: input.status });
  return mapAuditLogRow(row);
}

export interface ListAuditLogsFilter {
  userId?: string;
  rudderId?: string;
  status?: 'success' | 'failed';
  days?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listAuditLogs(filter: ListAuditLogsFilter = {}): Promise<PaginatedAuditLogs> {
  const page = filter.page || 1;
  const limit = filter.limit || 50;

  const { logs, total } = await auditLogQueries.list({
    userId: filter.userId,
    rudderId: filter.rudderId,
    status: filter.status,
    days: filter.days,
    page,
    limit,
  });

  return {
    items: logs.map(mapAuditLogRow),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
