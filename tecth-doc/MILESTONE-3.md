# Milestone 3 — Wheel BE + API

## Overview
Build the Node.js backend with REST API, WebSocket server, and job queue management. Implements rudder registry, authentication, and real-time communication.

## Tech Stack

- **Node.js 20** + npm
- **Express.js** (REST API)
- **Socket.io** (WebSocket)
- **TypeScript** (strict mode)
- **PostgreSQL** (job queue + audit logs)
- **Redis** (caching + sessions)
- **Pinia** (if shared state needed)

## Objectives

- [ ] Initialize Express.js project
- [ ] Setup PostgreSQL connection pool
- [ ] Setup Redis client
- [ ] Implement REST API endpoints
- [ ] Implement WebSocket server (Socket.io)
- [ ] Implement rudder registry
- [ ] Implement token validation
- [ ] Implement job queue management
- [ ] Setup error handling + logging
- [ ] Setup middleware (auth, cors, logging)

## Deliverables

### 1. Project Setup

```bash
cd wheel-be/
npm init -y
npm install express socket.io pg redis uuid dotenv cors
npm install -D typescript @types/express @types/node ts-node nodemon
```

**Files to create**:
- `tsconfig.json` — TypeScript config
- `src/server.ts` — Entry point (HTTP + WS)
- `src/app.ts` — Express app setup
- `.env.example` — Environment variables

### 2. Database Layer

**File**: `src/db/index.ts`
- PostgreSQL connection pool
- Query helpers with type safety
- Transaction support

**File**: `src/db/migrations/` (future)
- Schema versioning (using Flyway or custom)

**Queries**:
- `src/db/queries/users.ts` — User CRUD
- `src/db/queries/jobs.ts` — Job CRUD
- `src/db/queries/jobLogs.ts` — Job log append
- `src/db/queries/auditLogs.ts` — Audit log insert

### 3. Redis Cache Layer

**File**: `src/cache/index.ts`
- Redis connection
- Cache helpers

**Keys**:
- `rudder:{id}:session` — Rudder connection info (TTL: 24h)
- `rudder:{id}:containers` — Container snapshot (TTL: 10s)
- `rudder:{id}:images` — Image snapshot (TTL: 10s)

### 4. REST API Routes

**File**: `src/routes/auth.ts`
```
POST /api/auth/login
  - Request: { token }
  - Response: { sessionToken, user }
  - Validates token against RUDDER_TOKENS
```

**File**: `src/routes/rudders.ts`
```
GET /api/rudders
  - List all connected rudders (from Redis)
  - Query params: ?status=online|offline

GET /api/rudders/:id
  - Get single rudder details

GET /api/rudders/:id/health
  - Rudder health: status, uptime, docker version
```

**File**: `src/routes/containers.ts`
```
GET /api/containers
  - List all containers across rudders
  - Query params: ?status=running&rudder_id=x&image=nginx&page=1&limit=50

POST /api/containers/create
  - Request: { rudder_id, image, name, ports, env, mounts }
  - Creates job in PostgreSQL
  - Dispatches to rudder via WebSocket
  - Response: { jobId, status }

POST /api/containers/:id/start
POST /api/containers/:id/stop
POST /api/containers/:id/restart
DELETE /api/containers/:id
  - Similar pattern: create job → dispatch → return jobId
```

**File**: `src/routes/images.ts`
```
GET /api/images
  - List all images across rudders

POST /api/images/pull
  - Request: { rudder_id, repo }
  - Creates job, dispatches to rudder

DELETE /api/images/:id
  - Delete image (with optional force flag)
```

**File**: `src/routes/volumes.ts`
```
GET /api/volumes
  - List all volumes

POST /api/volumes/create
  - Request: { rudder_id, name, driver, labels }

DELETE /api/volumes/:id
```

**File**: `src/routes/jobs.ts`
```
GET /api/jobs
  - List job history
  - Query params: ?status=pending&rudder_id=x&days=7&page=1&limit=50

GET /api/jobs/:id
  - Get job details + logs
```

**File**: `src/routes/auditLogs.ts`
```
GET /api/audit-logs
  - List audit logs
  - Query params: ?rudder_id=x&days=30&status=success&page=1&limit=50
```

**File**: `src/routes/settings.ts`
```
GET /api/settings
  - User settings (theme, language, job retention)

PATCH /api/settings
  - Update settings
```

### 5. WebSocket Server (Socket.io)

**File**: `src/websocket/index.ts`
- Socket.io server setup
- CORS + auth middleware
- Event routing

**File**: `src/websocket/events/`

**Rudder → Wheel Events**:

`rudder:register`
```typescript
payload: {
  token: string;
  hostname: string;
  dockerVersion: string;
}
actions:
  - Validate token
  - Store in Redis: rudder:{id}:session
  - Broadcast: broadcast:rudder_online
  - Send back: wheel:ack
```

`rudder:heartbeat`
```typescript
payload: { rudder_id: string }
actions:
  - Update last_heartbeat in Redis
  - Send back: wheel:ack
```

`rudder:job_complete`
```typescript
payload: {
  job_id: string;
  status: 'done' | 'failed';
  result?: Record<string, any>;
  error?: string;
}
actions:
  - Update job status in PostgreSQL
  - Insert logs from result
  - Update audit log
  - Broadcast: broadcast:job_complete
```

**Wheel → Rudder Events** (server-initiated):

`wheel:job_dispatch`
```typescript
payload: {
  job_id: string;
  action: string;
  params: Record<string, any>;
}
```

`wheel:ack`
```typescript
payload: { timestamp: number }
```

**Broadcasts** (Wheel → All FE Clients):

`broadcast:rudder_online`
```typescript
payload: { rudder_id: string }
```

`broadcast:rudder_offline`
```typescript
payload: { rudder_id: string }
```

`broadcast:job_complete`
```typescript
payload: { job_id: string; status: string }
```

`broadcast:containers_updated`
```typescript
payload: { rudder_id: string; containers: Container[] }
```

### 6. Services (Business Logic)

**File**: `src/services/ContainerService.ts`
```typescript
class ContainerService {
  async create(rudderId, opts): Promise<Job>
  async start(containerId): Promise<Job>
  async stop(containerId): Promise<Job>
  async delete(containerId): Promise<Job>
  // ...
}
```

**File**: `src/services/JobService.ts`
```typescript
class JobService {
  async createJob(rudderId, action, params): Promise<Job>
  async updateJobStatus(jobId, status, result): Promise<void>
  async getJobHistory(filters): Promise<Job[]>
  async cleanupOldJobs(retentionDays): Promise<void> // Scheduled
  // ...
}
```

**File**: `src/services/RudderService.ts`
```typescript
class RudderService {
  async getRudders(): Promise<Rudder[]>
  async getRudderHealth(rudderId): Promise<RudderHealth>
  async updateRudderStatus(rudderId, status): Promise<void>
  // ...
}
```

### 7. Middleware

**File**: `src/middleware/auth.ts`
- Validate session token (JWT or session cookie)
- Extract user + permissions

**File**: `src/middleware/error.ts`
- Global error handler
- Format errors
- Log errors

**File**: `src/middleware/logging.ts`
- Request/response logging
- Structured JSON logs

**File**: `src/middleware/rateLimit.ts`
- Rate limiting per IP/user

**File**: `src/middleware/cors.ts`
- CORS configuration

### 8. Utilities

**File**: `src/utils/logger.ts`
- Structured logging (Winston or Pino)
- Log levels: info, warn, error, debug

**File**: `src/utils/errors.ts`
- Custom error classes
- Error handling helpers

**File**: `src/utils/validation.ts`
- Input validation
- Sanitization

### 9. Scheduled Tasks

**File**: `src/jobs/cleanup.ts`
- Job cleanup scheduler (runs daily)
- Deletes jobs older than `JOB_RETENTION_DAYS`
- Uses `node-cron` or similar

### 10. Configuration

**File**: `src/config/index.ts`
- Load environment variables
- Validate config on startup
- Export typed config object

### 11. Entry Point

**File**: `src/server.ts`
```typescript
import app from './app';
import { io } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const wsServer = io(server, { cors: { ... } });

// WebSocket handlers
wsServer.on('connection', handleRudderConnection);

server.listen(process.env.BE_PORT, () => {
  console.log(`Server running on port ${process.env.BE_PORT}`);
});
```

## API Implementation Pattern

Each endpoint follows this pattern:

```typescript
router.post<Params, Response, Body>(
  '/containers/create',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate input
      // 2. Check permissions
      // 3. Execute business logic
      // 4. Return response
      res.json(result);
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }
);
```

## Development Checklist

- [ ] Express app initialized
- [ ] TypeScript configured
- [ ] PostgreSQL connection working
- [ ] Redis connection working
- [ ] Auth middleware implemented
- [ ] All REST endpoints implemented
- [ ] WebSocket server running
- [ ] Rudder registration working
- [ ] Job dispatch flow working
- [ ] Real-time broadcasts working
- [ ] Error handling global
- [ ] Logging structured
- [ ] Rate limiting applied
- [ ] CORS configured
- [ ] Dev server runs on port 3000
- [ ] WS server runs on port 8080
- [ ] Integration with PostgreSQL schema (init.sql)
- [ ] Integration with Redis cache

## Completion Criteria

✅ API responds to requests  
✅ WebSocket connects + receives events  
✅ Job queue persists to PostgreSQL  
✅ Rudder registry in Redis  
✅ Real-time broadcasts to FE  
✅ Error handling + logging  
✅ All endpoints tested manually  

## Next Steps

→ **Milestone 4**: Build Rudder Agent (Docker socket client + WebSocket client)

---
