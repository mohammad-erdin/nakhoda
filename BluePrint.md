# Nakhoda Blueprint 🚢
**Docker Host Management Ecosystem**

---

## 1. Overview

**Nakhoda** is a distributed Docker orchestration platform where a central **Wheel** coordinates multiple **Rudders** (Docker agents) to manage containers, images, and volumes across multiple Docker hosts.

- **Wheel**: Central control plane (Node.js web UI + backend + WebSocket server)
- **Rudders**: Distributed agents running on Docker hosts with socket access
- **Communication**: Real-time bidirectional WebSocket with token-based authentication
- **Purpose**: Enable users to manage multiple Docker hosts from a single, unified dashboard

---

## 2. Goals & Success Metrics 🔧

| Metric | Target | Justification |
|--------|--------|---------------|
| **Job dispatch latency** | < 200ms p99 | Real-time user feedback |
| **Rudder connect time** | < 2s | Quick agent registration |
| **Rudder scale per wheel** | 50–100 agents | Practical lab/enterprise limit |
| **Container list refresh** | 5–10s cache TTL | Balance freshness vs load |
| **Command success rate** | > 99% | Reliability critical |
| **Uptime (Wheel)** | 99.9% | Acceptable for internal tool |
| **Message delivery** | At-least-once (with retry) | No lost job commands |

---

## 3. Assumptions & Constraints ⚠️

### Assumptions
- **Single user or team-based** (not SaaS, no multi-tenant yet).
- **Rudders on trusted network** (private/internal datacenter or VPN).
- **Docker hosts stable** (no frequent kernel upgrades mid-operation).
- **Network latency** < 100ms between wheel and rudders (same datacenter/region).

### Constraints
- **Docker socket access required** → Rudder needs privileged container or host-level mount.
- **No mTLS** (v1.0) → Token-based auth sufficient for trusted network.
- **Stateless wheel** → Easier horizontal scaling.
- **Redis is cache-only** → Loss is acceptable (containers list/proc cache), no core jobs stored.

---

## 4. Requirements

| Feature | Acceptance Criteria |
|---------|-------------------|
| **Rudder Registration** | Rudder connects via WebSocket, sends token, wheel validates & stores session |
| **Container Management** | Start, stop, restart, create, delete, prune containers on selected rudder |
| **Image Management** | List, pull, delete images; view history and layers |
| **Volume Management** | Create, delete, inspect volumes; mount to containers |
| **Real-time Status** | Live container/image list refresh; job completion feedback |
| **Multi-rudder dispatch** | User selects target rudder(s), command sent atomically |
| **Job history** | Audit log of all commands (who, what, when, rudder, success/fail) |
---

## 5. High-Level Architecture 🏗️

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                     │
│              (User @ 10.10.1.1:443)                     │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   Nginx (443/80)    │
          │    Reverse Proxy    │
          │    10.10.1.1:443    │
          └──────────┬──────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐  ┌──────▼──────┐  ┌─────▼─────┐
│  Wheel  │  │   Wheel BE  │  │  WS Server│
│  FE     │  │  (Node.js)  │  │(Socket.io)│
│  Vue 3  │  │  REST API   │  │  :8080    │
│         │  │  Job Logic  │  │           │
└─────────┘  └──────┬──────┘  └─────┬─────┘
                    │               │
              ┌─────▼───────────────▼─────┐
              │        Redis Cache        │
              │  (session + snapshots)    │
              │  :6379 (localhost)        │
              └───────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │ Primary PostgreSQL │
              │ (jobs + audit log) │
              │ :5432              │
              └────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ Rudder1 │      │ Rudder2 │      │ Rudder3 │
   │:10.x.x.1│      │:10.x.x.2│      │:10.x.x.3│
   │Token+WS │      │Token+WS │      │Token+WS │
   │Connect  │      │Connect  │      │Connect  │
   └────┬────┘      └────┬────┘      └────┬────┘
        │                │                │
   ┌────▼──────────┬──────▼──┬─────────────▼────┐
   │ Docker Host 1 │ Docker  │  Docker Host 3   │
   │ /var/run/     │ Host 2  │  /var/run/       │
   │ docker.sock   │         │  docker.sock     │
   └───────────────┴─────────┴──────────────────┘
```

### Component Responsibilities

**Wheel (Node.js Backend + UI)**
- REST API for CRUD operations (containers, images, volumes)
- WebSocket server (Socket.io) on port 8080
- Rudder registry (connected agents, health)
- Job queue management (persisted in RDBMS)
- Audit logging (RDBMS)
- Session management (token validation)

**Rudders (Docker Agents)**
- Connect to wheel via WSS (WebSocket Secure)
- Authenticate with token from `.env`
- Listen for job commands from wheel
- Execute Docker commands via mounted socket
- Send real-time status updates back to wheel
- Auto-reconnect on disconnect

**Redis (Cache only)**
- Session storage (rudder connections)
- Cache layer (container/image snapshots, /proc cache)
- Ephemeral performance data (safe to lose)

**Primary RDBMS (PostgreSQL)**
- FIFO job queue (durable)
- Job state transitions (pending → running → done/failed)
- Audit logs (immutable history)

**Nginx**
- TLS termination (443 → internal wheel)
- Reverse proxy for FE + BE APIs
- Static file serving (Vue 3 UI)

---

## 6. Communication Flow

### **Rudder Registration & Token Flow**

```
1. Rudder startup (reads .env with TOKEN)
     ↓
2. Rudder connects to wss://10.10.1.1:443
     ↓
3. Rudder emits: { action: "register", token: "xxx", hostInfo: {...} }
     ↓
4. Wheel validates token against RUDDER_TOKENS (comma-separated)
     ↓
5. If valid: Wheel stores session (rudder_id, ip, last_heartbeat) in Redis
     If invalid: Wheel closes connection
     ↓
6. Wheel broadcasts: "rudder_connected" to all FE users
```

### **Job Dispatch Flow**

```
User clicks "Create container on Rudder #1"
     ↓
FE sends POST /api/containers/create { rudder_id, image, name, ... }
     ↓
Wheel validates user + rudder availability
     ↓
Wheel writes job row to RDBMS (FIFO queue):
   {
     job_id: "uuid",
     rudder_id: "rudder_1",
     action: "container.create",
     params: {...},
     created_at: timestamp,
     status: "pending"
   }
     ↓
Wheel sends WS event to Rudder #1:
   { job_id, action, params }
     ↓
Rudder executes Docker API call
     ↓
Rudder sends back WS event:
   { job_id, status: "done|error", result: {...} }
     ↓
Wheel updates job in RDBMS (status: "done")
     ↓
Wheel notifies FE → UI updates
```

### **Heartbeat & Health Check**

```
Every 30s:
  Rudder sends: { action: "heartbeat", rudder_id: "x" }
  Wheel responds: { action: "ack", timestamp }
  
Wheel tracks: last_heartbeat for each rudder
If no heartbeat > 60s: Rudder marked OFFLINE
FE shows rudder as "⚠️ Disconnected"
Auto-retry reconnect on rudder (exponential backoff: 5s → 30s → 60s)
```

---

## 7. Data Model & Storage

### **Redis Keys (cache-only)**

```
# Rudder sessions (TTL: 24h)
rudder:rudder_1:session = {
  ip: "10.10.1.2",
  last_heartbeat: timestamp,
  status: "online|offline",
  version: "1.0.0",
  docker_info: { ... }
}

# Container cache per rudder (TTL: 10s)
rudder:rudder_1:containers = [
  { id, name, image, status, ports, mounts },
  ...
]
```

### **Primary RDBMS (Required, v1.0)**

Use PostgreSQL for **durable FIFO job queue** and **audit log**.

```sql
-- Jobs (FIFO by created_at)
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  rudder_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  params JSON NOT NULL,
  status ENUM('pending', 'running', 'done', 'failed') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL
);

CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX idx_jobs_rudder_created ON jobs(rudder_id, created_at);

-- Job logs (append-only)
CREATE TABLE job_logs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  message TEXT NOT NULL,
  level ENUM('info', 'warn', 'error') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_logs_job ON job_logs(job_id, created_at);
```

**Retention & Cleanup**
- Configurable retention window (e.g., `JOB_RETENTION_DAYS=30`).
- Scheduled cleanup deletes jobs + logs older than retention.

---

## 8. API Endpoints (Wheel)

### **REST Endpoints**

```
POST   /api/auth/login          → { token } (issue session token)
POST   /api/containers/create   → { rudder_id, image, name, ... }
POST   /api/containers/:id/start
POST   /api/containers/:id/stop
POST   /api/containers/:id/delete
GET    /api/containers          → List all containers across rudders
GET    /api/containers/:id/logs → Stream container logs

GET    /api/images              → List images
POST   /api/images/pull         → { rudder_id, repo }
DELETE /api/images/:id

GET    /api/volumes
POST   /api/volumes/create
DELETE /api/volumes/:id

GET    /api/rudders             → List connected rudders
GET    /api/rudders/:id/health  → { status, uptime, docker_version }

GET    /api/audit-logs?rudder_id=x&days=7
```

### **WebSocket Events**

```
# Rudder → Wheel
rudder:register       { token, hostname, docker_version }
rudder:heartbeat      { rudder_id }
rudder:job_complete   { job_id, status, result }
rudder:error          { error_msg }

# Wheel → Rudder
wheel:job_dispatch    { job_id, action, params }
wheel:ack             { }

# Wheel → FE Broadcast
broadcast:rudder_online     { rudder_id }
broadcast:rudder_offline    { rudder_id }
broadcast:job_complete      { job_id, result }
broadcast:containers_updated { rudder_id, containers }
```

---

## 9. Security & Best Practices 🔒

| Aspect | Implementation |
|--------|-----------------|
| **Authentication** | Token stored in rudder `.env`; validated by wheel on connect |
| **Transport** | HTTPS (443) + WSS (WebSocket Secure) for wheel; HTTP (8080) for rudder→wheel (internal) |
| **Docker Socket** | Mount read-only if possible; prefer API auth over direct socket |
| **Secrets** | Store rudder tokens in `.env` (not git); wheel stores in env var `RUDDER_TOKENS` |
| **RBAC** | v2.0: Add user roles (admin, viewer, operator) |
| **Audit Logging** | Log all commands with user, rudder, action, timestamp, result |
| **Rate Limiting** | Throttle requests per rudder (e.g., 10 jobs/sec max) |
| **Input Validation** | Sanitize container names, image repos, volume paths |

---

## 10. Scalability & Performance ⚡

### **Horizontal Scaling**

| Component | Scaling Strategy |
|-----------|-------------------|
| **Wheel (Node.js)** | Load-balance multiple instances behind Nginx; use Redis for shared state |
| **Redis (cache-only)** | Single instance sufficient for 50–100 rudders; upgrade to cluster if > 500 rudders |
| **Primary RDBMS** | Start with single instance + backups; add read replicas at scale |
| **Rudders** | Independent; each can reconnect to any wheel instance |

### **Performance Optimization**

1. **Container list caching**: Cache in Redis (10s TTL) instead of polling Docker every time
2. **Batch operations**: Group multiple commands per rudder into single WS message
3. **Connection pooling**: Reuse WS connections; avoid reconnect per job
4. **Compression**: Enable gzip for REST API + WebSocket payloads
5. **Lazy loading**: Load container details only on demand (list view ≠ detail view)
6. **Pagination**: List 50 items per page; load more on scroll

---

## 11. Reliability & Failure Handling 🛡️

### **Rudder Failure**

```
Scenario: Rudder crashes mid-job
Solution:
  1. Wheel detects no heartbeat > 60s
  2. Wheel retries pending jobs to other rudders OR marks as "retry"
  3. On rudder restart: auto-reconnect with exponential backoff
  4. Job marked TIMEOUT if no completion after 5 min
```

### **Wheel Failure**

```
Scenario: Wheel service restarts
Solution:
  1. Rudders auto-reconnect (exponential backoff)
  2. Pending jobs in RDBMS reloaded and re-dispatched on restart
  3. Redis cache warms lazily (container list refresh)
```

### **Network Partitions**

```
Scenario: Rudder ↔ Wheel disconnected
Solution:
  1. Rudder queues commands locally (in-memory buffer, size limit 100)
  2. On reconnect, rudder syncs queued commands
  3. If buffer overflow: discard oldest jobs (with warning)
```

---

## 12. Monitoring & Observability 


### **Alerting Rules**

```
- Rudder offline > 5 min → alert
- Job queue depth > 100 → warn
- Redis memory > 80% → warn
- Wheel error rate > 5% → alert
```

### **Logging**

```
Structured JSON logs:
  {
    timestamp,
    level: "info|warn|error",
    service: "wheel|rudder",
    event: "job_dispatch|container_created|error",
    rudder_id,
    job_id,
    duration_ms,
    result: "success|failed",
    error_msg (if failed)
  }
  
Aggregation: ELK Stack or Loki
```

---

## 13. Roadmap & Milestones

### **Milestone 1 — Project Structure & Design**
- Define repo layout (wheel-fe, wheel-be, rudder, shared, docs)
- Define repo layout for services used (redis, postgre, /data)
- Establish naming conventions + module boundaries
- Draft UI routes, state model, and API contract (v1)

### **Milestone 2 — Wheel FE (Vue 3)**
- Tech stack: Node.js 20 + npm, Ant Design Vue, Remixicon, Pinia, Vue Router
- Build Vue 3 UI shell (layout, navigation, rudder list)
- Auth flow (login UI + token storage)
- Rudder status dashboard (online/offline + heartbeat age)
- Container list UI (table + filters + pagination)

### **Milestone 3 — Wheel BE + API**
- Node.js REST API for containers/images/volumes
- WebSocket server for rudder events
- Rudder registry + token validation

### **Milestone 4 — Rudder Agent**
- Rudder connects via WSS and registers
- Docker socket integration (basic info + container list)
- Execute commands from wheel (start/stop/restart)

### **Milestone 5 — Job System (PostgreSQL)**
- FIFO job queue (jobs table)
- Job logs table (append-only)
- Retention scheduler (delete older than `JOB_RETENTION_DAYS`)

### **Milestone 6 — Observability & Hardening**
- Metrics export (Prometheus)
- Audit log UI
- Rate limiting + input validation

---

**Blueprint v1.0** — Ready to code! 🚀

