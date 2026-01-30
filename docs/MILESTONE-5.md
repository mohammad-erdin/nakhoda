# Milestone 5 — Job System (PostgreSQL)

## Overview
Implement durable job queue persistence, job logs, and automated retention cleanup. The job system is the heart of Nakhoda—all operations are jobs.

## Objectives

- [ ] Implement job creation + persistence to PostgreSQL
- [ ] Implement job status transitions (pending → running → done/failed)
- [ ] Implement job logs (append-only)
- [ ] Implement job history queries + filtering
- [ ] Implement scheduled cleanup (retention policy)
- [ ] Implement job retry logic
- [ ] Add job UI + job detail page (FE)
- [ ] Add job history filters (status, rudder, date range)

## Deliverables

### 1. Database Schema (Already in init.sql)

**Tables**:
- `jobs` — FIFO queue (id, rudder_id, action, params, status, result, error, created_at, started_at, completed_at)
- `job_logs` — Append-only logs (id, job_id, message, level, created_at)

**Indexes**:
- `(status, created_at DESC)` — Fast FIFO reads
- `(rudder_id, created_at DESC)` — Filter by rudder
- `(job_id, created_at DESC)` — Get logs for job

### 2. Backend Job Service

**File**: `wheel-be/src/services/JobService.ts`

```typescript
export class JobService {
  constructor(private db: PostgresClient, private redis: RedisClient) {}

  async createJob(
    rudderId: string,
    action: string,
    params: Record<string, any>,
    userId?: string
  ): Promise<Job> {
    // 1. Insert into jobs table (status = 'pending')
    // 2. Insert audit log
    // 3. Return job
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: Record<string, any>,
    error?: string
  ): Promise<void> {
    // 1. Update job status in PostgreSQL
    // 2. Set started_at or completed_at based on status
    // 3. If failed, store error
  }

  async appendJobLog(
    jobId: string,
    message: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ): Promise<void> {
    // 1. Insert into job_logs table
    // 2. Truncate old logs if > max size (prevent bloat)
  }

  async getJobHistory(
    filters: {
      status?: JobStatus;
      rudderId?: string;
      days?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Job>> {
    // 1. Query jobs table with filters
    // 2. Apply pagination
    // 3. Return paginated results
  }

  async getJobDetail(jobId: string): Promise<JobWithLogs> {
    // 1. Fetch job from PostgreSQL
    // 2. Fetch associated logs
    // 3. Return combined result
  }

  async retryJob(jobId: string): Promise<Job> {
    // 1. Create new job with same params as original
    // 2. Mark original as 'retried'
    // 3. Return new job
  }

  async cleanupOldJobs(retentionDays: number): Promise<number> {
    // 1. Delete jobs older than retentionDays with 'done' or 'failed' status
    // 2. Cascade delete job_logs
    // 3. Return count of deleted jobs
  }
}
```

### 3. Scheduled Cleanup Task

**File**: `wheel-be/src/jobs/cleanupScheduler.ts`

```typescript
import cron from 'node-cron';
import { JobService } from '@/services/JobService';

export function setupCleanupScheduler(jobService: JobService) {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const retentionDays = parseInt(process.env.JOB_RETENTION_DAYS || '30');
      const deleted = await jobService.cleanupOldJobs(retentionDays);
      logger.info(`Cleanup job: deleted ${deleted} old jobs`);
    } catch (error) {
      logger.error('Cleanup job failed:', error);
    }
  });
}
```

### 4. Job Route Updates

**File**: `wheel-be/src/routes/jobs.ts`

```typescript
// GET /api/jobs
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, rudder_id, days, page = 1, limit = 50 } = req.query;
    const jobs = await jobService.getJobHistory({
      status,
      rudderId: rudder_id,
      days: parseInt(days as string),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const job = await jobService.getJobDetail(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs/:id/retry
router.post('/:id/retry', authMiddleware, async (req, res, next) => {
  try {
    const newJob = await jobService.retryJob(req.params.id);
    res.json(newJob);
  } catch (error) {
    next(error);
  }
});
```

### 5. Job Integration in Container Service

**File**: `wheel-be/src/services/ContainerService.ts` (Updated)

```typescript
async create(rudderId: string, opts: CreateOpts): Promise<Job> {
  // 1. Validate rudder exists
  const rudder = await this.redis.get(`rudder:${rudderId}:session`);
  if (!rudder) throw new RudderNotFoundError(rudderId);

  // 2. Create job in PostgreSQL
  const job = await this.jobService.createJob(
    rudderId,
    JOB_ACTIONS.CONTAINER_CREATE,
    opts,
    userId
  );

  // 3. Dispatch to rudder via WebSocket
  this.io.to(rudderId).emit('wheel:job_dispatch', {
    job_id: job.id,
    action: job.action,
    params: job.params,
  });

  // 4. Update job status to 'running'
  await this.jobService.updateJobStatus(job.id, JobStatus.RUNNING);

  return job;
}

async handleJobComplete(
  jobId: string,
  status: JobStatus,
  result?: Record<string, any>,
  error?: string
): Promise<void> {
  // 1. Update job status in PostgreSQL
  await this.jobService.updateJobStatus(jobId, status, result, error);

  // 2. Append logs
  if (result?.logs) {
    for (const log of result.logs) {
      await this.jobService.appendJobLog(jobId, log.message, log.level);
    }
  }

  // 3. Update audit log
  await this.auditService.log({
    action: 'job.complete',
    status: status === JobStatus.DONE ? 'success' : 'failed',
    result,
    error,
  });

  // 4. Broadcast to FE
  this.io.emit('broadcast:job_complete', { job_id: jobId, status });
}
```

### 6. Frontend Job History Page

**File**: `wheel-fe/src/pages/JobHistory.vue`

**Features**:
- Table of jobs (latest first)
- Columns: job_id, action, rudder, status, created_at, completed_at, duration
- Filters: status (pending/running/done/failed), rudder, date range
- Pagination (50 items per page)
- Click row to view details
- Retry button for failed jobs

**Component**: `wheel-fe/src/components/JobTable.vue`
**Component**: `wheel-fe/src/components/JobFilters.vue`

### 7. Frontend Job Detail Page

**File**: `wheel-fe/src/pages/JobDetail.vue`

**Sections**:
1. **Metadata**
   - Job ID
   - Action
   - Rudder
   - Status (badge)
   - Created, Started, Completed timestamps
   - Duration

2. **Parameters** (JSON viewer)
   - Input params to Docker operation

3. **Result** (JSON viewer)
   - Output from Docker

4. **Logs** (list)
   - Chronological list of job logs
   - Each log shows: timestamp, level (badge), message
   - Color-coded by level (info=blue, warn=yellow, error=red)

5. **Actions**
   - Retry button (if failed)
   - Copy job ID button
   - Back to list button

**Pinia Update**: `useJobs()` store with `getJobDetail()` action

### 8. Audit Logging Integration

**File**: `wheel-be/src/services/AuditService.ts`

```typescript
export class AuditService {
  async log(
    userId: string | undefined,
    action: string,
    rudderId: string | undefined,
    status: 'success' | 'failed',
    params?: Record<string, any>,
    result?: Record<string, any>,
    error?: string,
    ipAddress?: string
  ): Promise<void> {
    // Insert into audit_logs table
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      rudderId?: string;
      days?: number;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<AuditLog>> {
    // Query audit_logs with filters
  }
}
```

### 9. Job Status Flow Diagram

```
User Action (e.g., create container)
     ↓
[Service] createJob()
     ↓
Insert into jobs table: status = 'pending'
     ↓
Dispatch to Rudder via WebSocket
Update job status = 'running'
     ↓
[Rudder] receives 'wheel:job_dispatch'
Executes Docker command
     ↓
[Rudder] sends 'rudder:job_complete'
     ↓
[Wheel] handleJobComplete()
Update job status = 'done' or 'failed'
Append logs from result
Update audit log
Broadcast 'broadcast:job_complete'
     ↓
[FE] receives broadcast
Update store
Show notification
Update UI
     ↓
User sees completion
```

### 10. Retention Policy

**Configuration** (via `.env`):
```
JOB_RETENTION_DAYS=30
CLEANUP_SCHEDULE=0 2 * * * (cron format)
```

**Behavior**:
- Every day at 2 AM (configurable), run cleanup
- Delete jobs where `status IN ('done', 'failed')` AND `created_at < NOW() - JOB_RETENTION_DAYS`
- Cascade delete associated job_logs
- Log cleanup count

**Safety**:
- Only delete completed jobs, never pending/running
- Can be disabled by setting `JOB_RETENTION_DAYS=0`
- Can be manually triggered via admin endpoint (future)

## Implementation Checklist

- [ ] JobService class created + all methods
- [ ] Cleanup scheduler configured
- [ ] Job routes implemented (list, detail, retry)
- [ ] ContainerService updated to use job system
- [ ] ImageService updated to use job system
- [ ] VolumeService updated to use job system
- [ ] Audit logging integrated
- [ ] Job history page built (FE)
- [ ] Job detail page built (FE)
- [ ] Job filters working (status, rudder, date)
- [ ] Retry button functional
- [ ] Logs displayed correctly
- [ ] Cleanup scheduler tested
- [ ] Cascading delete tested
- [ ] Broadcast job completion working
- [ ] FE receives + displays job updates

## Completion Criteria

✅ Jobs persist to PostgreSQL  
✅ Job status transitions tracked  
✅ Job logs append correctly  
✅ Cleanup runs daily  
✅ Old jobs deleted based on retention  
✅ FE displays job history + detail  
✅ Job retry works  
✅ Audit logs immutable + queryable  

## Next Steps

→ **Milestone 6**: Observability & Hardening (Prometheus metrics, input validation, rate limiting)

---
