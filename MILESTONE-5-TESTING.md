# Milestone 5 Testing Guide

## Prerequisites
1. PostgreSQL running and accessible
2. Redis running and accessible
3. Wheel backend configured with proper environment variables
4. At least one Rudder agent configured and ready to connect

## Environment Setup

### Required Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=nakhoda
DB_PASSWORD=nakhoda
DB_NAME=nakhoda

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Job Configuration
JOB_RETENTION_DAYS=30
JOB_TIMEOUT_MS=300000

# Rudder Tokens
RUDDER_TOKENS=token_rudder_1,token_rudder_2

# JWT
JWT_SECRET=your-secret-key
```

## Test Scenarios

### 1. Job Creation and Dispatch

**Test**: Create a container
```bash
curl -X POST http://localhost:3000/api/containers/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rudder_id": "rudder_1",
    "image": "nginx:latest",
    "name": "test-nginx"
  }'
```

**Expected**:
- ✅ Response contains `jobId` and status `running`
- ✅ Job created in PostgreSQL with status `pending`
- ✅ Job immediately dispatched to Rudder via WebSocket
- ✅ Job status updated to `running` in database
- ✅ Rudder receives `wheel:job_dispatch` event

**Verification**:
```sql
-- Check job in database
SELECT id, action, status, created_at, started_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show status = 'running' and started_at populated
```

### 2. Job Completion

**Test**: Wait for rudder to complete the job

**Expected**:
- ✅ Rudder executes Docker operation
- ✅ Rudder sends `rudder:job_complete` event
- ✅ Job status updated to `done` in database
- ✅ Job `completed_at` timestamp populated
- ✅ Job `result` field contains operation output
- ✅ Frontend receives `broadcast:job_complete` event

**Verification**:
```sql
-- Check completed job
SELECT id, action, status, result, created_at, completed_at 
FROM jobs 
WHERE id = 'YOUR_JOB_ID';

-- Should show status = 'done' and completed_at populated
```

### 3. Job Failure

**Test**: Create container with invalid image
```bash
curl -X POST http://localhost:3000/api/containers/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rudder_id": "rudder_1",
    "image": "nonexistent:image",
    "name": "test-fail"
  }'
```

**Expected**:
- ✅ Job created and dispatched
- ✅ Rudder fails to pull image
- ✅ Job status updated to `failed`
- ✅ Job `error` field contains error message

**Verification**:
```sql
SELECT id, action, status, error 
FROM jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 1;
```

### 4. Job Logs

**Test**: Check job logs are being recorded

**Expected**:
- ✅ Job execution creates log entries
- ✅ Logs are stored in `job_logs` table
- ✅ Logs are ordered chronologically
- ✅ Log levels (info, warn, error) are preserved

**Verification**:
```sql
SELECT jl.message, jl.level, jl.created_at
FROM job_logs jl
JOIN jobs j ON j.id = jl.job_id
WHERE j.id = 'YOUR_JOB_ID'
ORDER BY jl.created_at ASC;
```

### 5. Job History API

**Test**: List jobs with filters
```bash
# All jobs
curl http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Failed jobs only
curl "http://localhost:3000/api/jobs?status=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Jobs for specific rudder
curl "http://localhost:3000/api/jobs?rudder_id=rudder_1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Jobs from last 7 days
curl "http://localhost:3000/api/jobs?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pagination
curl "http://localhost:3000/api/jobs?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**:
- ✅ Returns paginated results
- ✅ Filters work correctly
- ✅ Total count is accurate
- ✅ Jobs are ordered by creation time (newest first)

### 6. Job Detail API

**Test**: Get job details with logs
```bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**:
- ✅ Returns complete job data
- ✅ Includes all timestamps
- ✅ Includes parameters
- ✅ Includes result (if completed)
- ✅ Includes error (if failed)
- ✅ Includes all logs in chronological order

### 7. Job Retry

**Test**: Retry a failed job
```bash
curl -X POST http://localhost:3000/api/jobs/YOUR_FAILED_JOB_ID/retry \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**:
- ✅ Creates new job with same parameters
- ✅ Returns new job ID
- ✅ Original job remains unchanged
- ✅ New job is dispatched immediately

### 8. Cleanup Scheduler

**Test**: Verify old jobs are deleted

**Manual Test**:
```javascript
// In wheel-be, temporarily modify cleanup.ts to run every minute
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute instead of 24 hours

// Or manually trigger cleanup:
const JobService = require('./services/JobService');
await JobService.cleanupOldJobs();
```

**Expected**:
- ✅ Only deletes jobs older than `JOB_RETENTION_DAYS`
- ✅ Only deletes jobs with status `done` or `failed`
- ✅ Never deletes `pending` or `running` jobs
- ✅ Cascade deletes associated logs from `job_logs`
- ✅ Returns count of deleted jobs
- ✅ Logs cleanup activity

**Verification**:
```sql
-- Create old completed job (manually set created_at)
INSERT INTO jobs (id, rudder_id, action, params, status, created_at)
VALUES (
  gen_random_uuid(),
  'rudder_1',
  'test.action',
  '{}',
  'done',
  NOW() - INTERVAL '31 days'
);

-- Run cleanup (should delete it)

-- Verify it's gone
SELECT COUNT(*) FROM jobs WHERE created_at < NOW() - INTERVAL '30 days';
-- Should return 0
```

### 9. Frontend Job History

**Test**: Navigate to job history page

**Expected**:
- ✅ Table displays all jobs
- ✅ Status badges show correct colors
- ✅ Filters work (status, rudder, days)
- ✅ Pagination works
- ✅ Clicking row navigates to job detail
- ✅ Job IDs are truncated for display
- ✅ Timestamps are formatted correctly
- ✅ Duration is calculated correctly

### 10. Frontend Job Detail

**Test**: Click on a job in history

**Expected**:
- ✅ Navigates to `/jobs/:id`
- ✅ Displays job metadata (ID, action, rudder, status, timestamps)
- ✅ Displays parameters in JSON format
- ✅ Displays result if job completed
- ✅ Displays error if job failed
- ✅ Displays logs in chronological order
- ✅ Log levels are color-coded (error=red, warn=orange, info=blue)
- ✅ Copy ID button works
- ✅ Retry button shows for failed jobs
- ✅ Back button returns to history

### 11. WebSocket Integration

**Test**: Real-time job updates

**Expected**:
- ✅ Frontend receives `broadcast:job_complete` when job finishes
- ✅ Job status in UI updates without refresh
- ✅ Job list refreshes on completion
- ✅ Notifications show for job completion

### 12. Multi-Operation Flow

**Test**: Create multiple jobs in sequence
```bash
# Create 3 containers
for i in 1 2 3; do
  curl -X POST http://localhost:3000/api/containers/create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"rudder_id\":\"rudder_1\",\"image\":\"nginx:latest\",\"name\":\"test-$i\"}"
  sleep 1
done
```

**Expected**:
- ✅ All jobs created successfully
- ✅ All jobs dispatched to rudder
- ✅ Jobs execute in order (FIFO)
- ✅ All jobs complete successfully
- ✅ Job history shows all 3 jobs

### 13. Rudder Reconnection

**Test**: Disconnect and reconnect rudder

**Steps**:
1. Create job while rudder is connected
2. Stop rudder agent
3. Create another job (should remain pending)
4. Start rudder agent
5. Verify pending job is dispatched on reconnect

**Expected**:
- ✅ Pending jobs are dispatched when rudder reconnects
- ✅ Jobs transition from `pending` to `running`
- ✅ No jobs are lost

## Performance Tests

### Load Test: Create 100 Jobs
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/containers/create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"rudder_id\":\"rudder_1\",\"image\":\"alpine:latest\",\"name\":\"load-test-$i\"}" &
done
wait
```

**Expected**:
- ✅ All jobs created
- ✅ Database handles concurrent inserts
- ✅ All jobs dispatched successfully
- ✅ No race conditions
- ✅ System remains responsive

## Error Handling Tests

### 1. Rudder Offline
```bash
# Try to create job with offline rudder
curl -X POST http://localhost:3000/api/containers/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rudder_id": "offline_rudder",
    "image": "nginx:latest",
    "name": "test"
  }'
```

**Expected**:
- ✅ Returns 400 error
- ✅ Error message: "Rudder not online"
- ✅ No job created

### 2. Invalid Job Parameters
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/containers/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rudder_id": "rudder_1"
  }'
```

**Expected**:
- ✅ Returns 400 validation error
- ✅ Error describes missing fields
- ✅ No job created

### 3. Database Connection Lost

**Test**: Stop PostgreSQL during operation

**Expected**:
- ✅ Graceful error handling
- ✅ Error logged
- ✅ Returns 500 error to client
- ✅ System recovers when DB comes back

## Security Tests

### 1. Authentication Required
```bash
# Try without token
curl http://localhost:3000/api/jobs
```

**Expected**:
- ✅ Returns 401 Unauthorized
- ✅ No data leaked

### 2. SQL Injection Prevention
```bash
# Try SQL injection in filters
curl "http://localhost:3000/api/jobs?status=done'; DROP TABLE jobs; --" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**:
- ✅ Parameterized queries prevent injection
- ✅ No SQL execution
- ✅ Returns safe results or validation error

## Audit Log Verification

**Test**: Verify audit logs are created
```sql
SELECT 
  action, 
  status, 
  rudder_id, 
  created_at 
FROM audit_logs 
WHERE action LIKE 'container.%'
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected**:
- ✅ Each container operation has audit log
- ✅ User ID recorded (if authenticated)
- ✅ Rudder ID recorded
- ✅ Action status recorded
- ✅ Timestamp accurate

## Success Criteria

All tests pass with:
- ✅ Jobs created and persisted correctly
- ✅ Jobs dispatched immediately after creation
- ✅ Job status transitions work (pending → running → done/failed)
- ✅ Job logs recorded and retrievable
- ✅ Cleanup scheduler deletes old completed jobs only
- ✅ Job retry creates new job with same parameters
- ✅ Frontend displays job history and details correctly
- ✅ Filters and pagination work as expected
- ✅ WebSocket broadcasts job completion
- ✅ No security vulnerabilities
- ✅ No race conditions or concurrency issues
- ✅ Graceful error handling throughout

## Known Limitations

1. Job timeout not implemented yet (planned for future milestone)
2. Job priority/ordering based only on creation time
3. No job cancellation feature yet
4. Cleanup runs once per 24 hours (not configurable cron)
