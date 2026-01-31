# API Contract v1

## Base URL
```
Development: http://localhost:3000/api
Production: https://{domain}/api
```

---

## Authentication

### POST /auth/login
```typescript
// Request
{
  token: string;
}

// Response (200 OK)
{
  sessionToken: string; // JWT for subsequent requests
  user: {
    id: string;
    name: string;
  };
}

// Errors
401 Unauthorized - Invalid token
400 Bad Request - Missing token
```

**Headers** (all subsequent requests):
```
Authorization: Bearer {sessionToken}
```

---

## Rudders

### GET /rudders
List all connected rudders.

```typescript
// Response (200 OK)
[
  {
    id: string;
    hostname: string;
    status: 'online' | 'offline';
    dockerVersion: string;
    lastHeartbeat: ISO8601;
    createdAt: ISO8601;
  }
]

// Query params (optional)
?status=online|offline
```

### GET /rudders/:id
Get single rudder details.

```typescript
// Response (200 OK)
{
  id: string;
  hostname: string;
  status: 'online' | 'offline';
  dockerVersion: string;
  lastHeartbeat: ISO8601;
  createdAt: ISO8601;
  containerCount: number;
  imageCount: number;
}

// Errors
404 Not Found - Rudder doesn't exist
```

### GET /rudders/:id/health
Get rudder health info.

```typescript
// Response (200 OK)
{
  status: 'online' | 'offline';
  uptime: number; // seconds
  dockerVersion: string;
  lastHeartbeat: ISO8601;
}
```

---

## Containers

### GET /containers
List all containers (across all rudders).

```typescript
// Response (200 OK)
[
  {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'exited';
    rudderId: string;
    ports: Record<string, number>; // { "3000/tcp": 3000, ... }
    mounts: Array<{ source: string; destination: string }>;
    createdAt: ISO8601;
    startedAt?: ISO8601;
  }
]

// Query params (optional)
?status=running|stopped|exited
?rudder_id=rudder_1
?image=nginx
?page=1&limit=50
```

### POST /containers/create
Create new container on specified rudder.

```typescript
// Request
{
  rudder_id: string;
  image: string; // e.g., "nginx:latest"
  name: string;
  ports?: Record<string, number>; // { "80": 8080, ... }
  env?: Record<string, string>; // { "VAR": "value", ... }
  mounts?: Array<{ source: string; destination: string }>;
  cmd?: string[];
}

// Response (200 OK)
{
  jobId: string; // Job created, not immediately running
  containerId?: string;
  status: 'pending' | 'running';
}

// Errors
404 Not Found - Rudder doesn't exist
400 Bad Request - Invalid image
```

### POST /containers/:id/start
Start stopped container.

```typescript
// Request (no body)

// Response (200 OK)
{
  jobId: string;
  status: 'running';
}

// Errors
404 Not Found - Container doesn't exist
409 Conflict - Already running
```

### POST /containers/:id/stop
Stop running container.

```typescript
// Request (no body)

// Response (200 OK)
{
  jobId: string;
  status: 'stopped';
}

// Errors
404 Not Found - Container doesn't exist
```

### POST /containers/:id/restart
Restart container.

```typescript
// Request (no body)

// Response (200 OK)
{
  jobId: string;
  status: 'running';
}
```

### DELETE /containers/:id
Delete container.

```typescript
// Request (no body)

// Response (200 OK)
{
  jobId: string;
  message: "Container deleted";
}

// Query params (optional)
?force=true (force remove if running)
```

### GET /containers/:id/logs
Stream container logs (WebSocket or Server-Sent Events).

```typescript
// Response (Streaming)
{
  timestamp: ISO8601;
  message: string;
  level: 'stdout' | 'stderr';
}

// Or via WS:
// On connection, emit: { action: "logs", containerId }
```

---

## Images

### GET /images
List all images (across all rudders).

```typescript
// Response (200 OK)
[
  {
    id: string;
    repo: string; // "nginx"
    tag: string; // "latest"
    size: number; // bytes
    createdAt: ISO8601;
    usedByContainers: number;
    rudderId: string;
  }
]

// Query params (optional)
?repo=nginx
?rudder_id=rudder_1
```

### POST /images/pull
Pull image to specified rudder.

```typescript
// Request
{
  rudder_id: string;
  repo: string; // "nginx:latest" or "ghcr.io/org/image:tag"
}

// Response (200 OK)
{
  jobId: string;
  status: 'pending';
  message: "Pulling image...";
}

// Errors
404 Not Found - Rudder doesn't exist
400 Bad Request - Invalid image repo
```

### DELETE /images/:id
Delete image from rudder.

```typescript
// Request (no body)

// Response (200 OK)
{
  message: "Image deleted";
}

// Query params (optional)
?force=true (force remove if used by container)

// Errors
404 Not Found - Image doesn't exist
409 Conflict - Image in use
```

---

## Volumes

### GET /volumes
List all volumes.

```typescript
// Response (200 OK)
[
  {
    id: string;
    name: string;
    driver: string; // "local"
    mountPoint: string;
    usedByContainers: number;
    rudderId: string;
    createdAt: ISO8601;
  }
]

// Query params (optional)
?rudder_id=rudder_1
?driver=local
```

### POST /volumes/create
Create new volume.

```typescript
// Request
{
  rudder_id: string;
  name: string;
  driver?: string; // default: "local"
  labels?: Record<string, string>;
}

// Response (200 OK)
{
  jobId: string;
  volumeId: string;
  status: 'pending';
}
```

### DELETE /volumes/:id
Delete volume.

```typescript
// Request (no body)

// Response (200 OK)
{
  message: "Volume deleted";
}

// Errors
404 Not Found - Volume doesn't exist
409 Conflict - Volume in use
```

---

## Jobs

### GET /jobs
List all jobs (history).

```typescript
// Response (200 OK)
[
  {
    id: string;
    rudderId: string;
    action: string; // "container.start", "image.pull", etc
    status: 'pending' | 'running' | 'done' | 'failed';
    params: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    createdAt: ISO8601;
    startedAt?: ISO8601;
    completedAt?: ISO8601;
  }
]

// Query params (optional)
?status=pending|running|done|failed
?rudder_id=rudder_1
?days=7 (last 7 days)
?page=1&limit=50
```

### GET /jobs/:id
Get job details.

```typescript
// Response (200 OK)
{
  id: string;
  rudderId: string;
  action: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: ISO8601;
  startedAt?: ISO8601;
  completedAt?: ISO8601;
  logs: Array<{
    timestamp: ISO8601;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

// Errors
404 Not Found - Job doesn't exist
```

---

## Audit Logs

### GET /audit-logs
List audit log entries.

```typescript
// Response (200 OK)
[
  {
    id: string;
    userId: string;
    rudderId: string;
    action: string;
    status: 'success' | 'failed';
    result: Record<string, any>;
    createdAt: ISO8601;
  }
]

// Query params (optional)
?rudder_id=rudder_1
?days=30
?status=success|failed
?page=1&limit=50
```

---

## Settings

### GET /settings
Get user settings.

```typescript
// Response (200 OK)
{
  jobRetentionDays: number;
  theme: 'light' | 'dark';
  language: string;
}
```

### PATCH /settings
Update user settings.

```typescript
// Request
{
  jobRetentionDays?: number;
  theme?: 'light' | 'dark';
}

// Response (200 OK)
{
  jobRetentionDays: number;
  theme: string;
}
```

---

## Error Responses

### Standard Error Format
```typescript
// 4xx, 5xx responses
{
  error: string; // human-readable message
  code: string; // machine-readable code (e.g., "RUDDER_NOT_FOUND")
  details?: Record<string, any>; // additional context
}
```

### Common HTTP Status Codes
- `200 OK` — Success
- `201 Created` — Resource created (not used yet, all POST return 200)
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid auth
- `403 Forbidden` — Insufficient permissions (v2.0)
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Business logic violation (e.g., container already running)
- `500 Internal Server Error` — Server error

---

## Rate Limiting

```
X-RateLimit-Limit: 1000 (requests per minute)
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200 (unix timestamp)
```

---

## WebSocket Events

### Client → Server

#### `rudder:register`
```typescript
{
  token: string;
  hostname: string;
  dockerVersion: string;
}
```

#### `rudder:heartbeat`
```typescript
{
  rudder_id: string;
}
```

#### `rudder:job_complete`
```typescript
{
  job_id: string;
  status: 'done' | 'failed';
  result?: Record<string, any>;
  error?: string;
}
```

### Server → Client

#### `wheel:ack`
```typescript
{
  timestamp: number;
}
```

#### `wheel:job_dispatch`
```typescript
{
  job_id: string;
  action: string;
  params: Record<string, any>;
}
```

#### `broadcast:rudder_online`
```typescript
{
  rudder_id: string;
}
```

#### `broadcast:rudder_offline`
```typescript
{
  rudder_id: string;
}
```

#### `broadcast:job_complete`
```typescript
{
  job_id: string;
  status: 'done' | 'failed';
}
```

#### `broadcast:containers_updated`
```typescript
{
  rudder_id: string;
  containers: Container[];
}
```

---

**API v1.0** — Stable for Milestone 2+

