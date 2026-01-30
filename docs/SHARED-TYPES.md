# Shared Types Package

## Overview
The `shared/` package exports types + constants used across `wheel-fe`, `wheel-be`, and `rudder`. This ensures consistency and single source of truth.

---

## Files Structure

### `shared/types/index.ts`
Re-exports all types (single entry point).

### `shared/types/api.ts`
API request/response types.

```typescript
// API Request/Response wrappers
export interface ApiRequest<T> {
  data: T;
  timestamp: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: number;
}

// Auth
export interface LoginRequest {
  token: string;
}

export interface LoginResponse {
  sessionToken: string;
  user: User;
}

// Generic pagination
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### `shared/types/entities.ts`
Core entity types.

```typescript
// Rudder
export interface Rudder {
  id: string;
  hostname: string;
  status: 'online' | 'offline';
  dockerVersion: string;
  lastHeartbeat: Date;
  createdAt: Date;
}

// Container
export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'exited';
  rudderId: string;
  ports: Record<string, number>;
  mounts: Array<{ source: string; destination: string }>;
  env: Record<string, string>;
  createdAt: Date;
  startedAt?: Date;
}

// Image
export interface Image {
  id: string;
  repo: string;
  tag: string;
  size: number;
  createdAt: Date;
  usedByContainers: number;
  rudderId: string;
}

// Volume
export interface Volume {
  id: string;
  name: string;
  driver: string;
  mountPoint: string;
  usedByContainers: number;
  rudderId: string;
  createdAt: Date;
}

// Job
export interface Job {
  id: string;
  rudderId: string;
  action: string;
  status: JobStatus;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
}

// User (minimal)
export interface User {
  id: string;
  name: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  rudderId: string;
  action: string;
  status: 'success' | 'failed';
  result: Record<string, any>;
  createdAt: Date;
}
```

### `shared/types/websocket.ts`
WebSocket event types.

```typescript
// Rudder → Wheel
export interface RudderRegisterPayload {
  token: string;
  hostname: string;
  dockerVersion: string;
}

export interface RudderHeartbeatPayload {
  rudder_id: string;
}

export interface RudderJobCompletePayload {
  job_id: string;
  status: 'done' | 'failed';
  result?: Record<string, any>;
  error?: string;
}

// Wheel → Rudder
export interface WheelJobDispatchPayload {
  job_id: string;
  action: string;
  params: Record<string, any>;
}

export interface WheelAckPayload {
  timestamp: number;
}

// Broadcasts (Wheel → FE)
export interface BroadcastRudderOnlinePayload {
  rudder_id: string;
}

export interface BroadcastRudderOfflinePayload {
  rudder_id: string;
}

export interface BroadcastJobCompletePayload {
  job_id: string;
  status: 'done' | 'failed';
}

export interface BroadcastContainersUpdatedPayload {
  rudder_id: string;
  containers: Container[];
}
```

### `shared/constants/job-actions.ts`
Job action constants.

```typescript
export const JOB_ACTIONS = {
  // Container
  CONTAINER_CREATE: 'container.create',
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_RESTART: 'container.restart',
  CONTAINER_DELETE: 'container.delete',
  CONTAINER_PRUNE: 'container.prune',

  // Image
  IMAGE_PULL: 'image.pull',
  IMAGE_DELETE: 'image.delete',
  IMAGE_PRUNE: 'image.prune',

  // Volume
  VOLUME_CREATE: 'volume.create',
  VOLUME_DELETE: 'volume.delete',
  VOLUME_PRUNE: 'volume.prune',
} as const;

export type JobAction = typeof JOB_ACTIONS[keyof typeof JOB_ACTIONS];
```

### `shared/constants/ws-events.ts`
WebSocket event names.

```typescript
export const WS_EVENTS = {
  // Rudder → Wheel
  RUDDER_REGISTER: 'rudder:register',
  RUDDER_HEARTBEAT: 'rudder:heartbeat',
  RUDDER_JOB_COMPLETE: 'rudder:job_complete',
  RUDDER_ERROR: 'rudder:error',

  // Wheel → Rudder
  WHEEL_JOB_DISPATCH: 'wheel:job_dispatch',
  WHEEL_ACK: 'wheel:ack',

  // Broadcasts
  BROADCAST_RUDDER_ONLINE: 'broadcast:rudder_online',
  BROADCAST_RUDDER_OFFLINE: 'broadcast:rudder_offline',
  BROADCAST_JOB_COMPLETE: 'broadcast:job_complete',
  BROADCAST_CONTAINERS_UPDATED: 'broadcast:containers_updated',
} as const;
```

### `shared/constants/endpoints.ts`
API endpoint paths.

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  RUDDERS: {
    LIST: '/rudders',
    GET: (id: string) => `/rudders/${id}`,
    HEALTH: (id: string) => `/rudders/${id}/health`,
  },
  CONTAINERS: {
    LIST: '/containers',
    CREATE: '/containers/create',
    START: (id: string) => `/containers/${id}/start`,
    STOP: (id: string) => `/containers/${id}/stop`,
    RESTART: (id: string) => `/containers/${id}/restart`,
    DELETE: (id: string) => `/containers/${id}`,
    LOGS: (id: string) => `/containers/${id}/logs`,
  },
  IMAGES: {
    LIST: '/images',
    PULL: '/images/pull',
    DELETE: (id: string) => `/images/${id}`,
  },
  VOLUMES: {
    LIST: '/volumes',
    CREATE: '/volumes/create',
    DELETE: (id: string) => `/volumes/${id}`,
  },
  JOBS: {
    LIST: '/jobs',
    GET: (id: string) => `/jobs/${id}`,
  },
  AUDIT_LOGS: {
    LIST: '/audit-logs',
  },
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },
} as const;
```

### `shared/constants/index.ts`
Export all constants.

```typescript
export * from './job-actions';
export * from './ws-events';
export * from './endpoints';

// Global constants
export const JOB_RETENTION_DAYS = 30;
export const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
export const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 sec
export const RUDDER_OFFLINE_THRESHOLD_MS = 60 * 1000; // 60 sec
export const REDIS_CACHE_TTL_SECONDS = 10;
```

### `shared/types/index.ts`
Central export.

```typescript
export * from './api';
export * from './entities';
export * from './websocket';
```

### `shared/package.json`
```json
{
  "name": "@nakhoda/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "types", "constants"],
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {}
}
```

---

## Usage Examples

### In wheel-fe (Vue component)
```typescript
import { Container, JOB_ACTIONS, API_ENDPOINTS } from '@nakhoda/shared';

const containers: Container[] = [];

const onCreateContainer = async () => {
  const response = await fetch(API_ENDPOINTS.CONTAINERS.CREATE, {
    method: 'POST',
    body: JSON.stringify({ ... })
  });
};
```

### In wheel-be (Express route)
```typescript
import { Container, Job, JOB_ACTIONS } from '@nakhoda/shared';

app.post<{}, Container, CreateContainerReq>(
  API_ENDPOINTS.CONTAINERS.CREATE,
  async (req, res) => {
    const job: Job = {
      action: JOB_ACTIONS.CONTAINER_CREATE,
      ...
    };
  }
);
```

### In rudder (Docker client)
```typescript
import { WS_EVENTS, WheelJobDispatchPayload } from '@nakhoda/shared';

socket.on(WS_EVENTS.WHEEL_JOB_DISPATCH, (payload: WheelJobDispatchPayload) => {
  if (payload.action === JOB_ACTIONS.CONTAINER_START) {
    // Execute start
  }
});
```

---
