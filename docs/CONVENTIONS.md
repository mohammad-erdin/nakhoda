# Code Conventions & Style Guide

## Frontend Tech Stack (Phase 2)

- Node.js 20 + npm
- Vue 3
- Ant Design Vue
- Remixicon
- Pinia
- Vue Router

## TypeScript & General Rules

### Types & Interfaces
```typescript
// ✅ DO: Use interface for object shapes
interface Container {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  createdAt: Date;
}

// ✅ DO: Use type for unions / complex shapes
type ContainerAction = 'start' | 'stop' | 'restart' | 'create' | 'delete';

// ✅ DO: Export from shared/types
import { Container, Job, JobStatus } from '@nakhoda/shared/types';

// ❌ DON'T: Use `any` type
let data: any; // Bad

// ❌ DON'T: Mix interface + type for same entity
interface User {} // Bad if type User exists elsewhere
```

### Constants
```typescript
// ✅ DO: Group related constants in dedicated files
// shared/constants/job-actions.ts
export const JOB_ACTIONS = {
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_CREATE: 'container.create',
} as const;

export const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
export const JOB_RETENTION_DAYS = 30;

// ✅ DO: Use `as const` for type-safe enums
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
}

// ❌ DON'T: Hardcode magic strings in code
if (job.status === 'pending') {} // Bad, use JOB_STATUS.PENDING
```

### Imports
```typescript
// ✅ DO: Use absolute imports (via tsconfig paths)
import { Container } from '@nakhoda/shared/types';
import { useAuth } from '@/composables/useAuth'; // wheel-fe

// ❌ DON'T: Use relative imports
import { Container } from '../../../../../shared/types'; // Bad

// ✅ DO: Group imports logically
import { Container, Job } from '@nakhoda/shared/types';
import { PostgresClient } from '@/db';
import { logger } from '@/utils';
```

---

## Vue 3 Components

### Component Structure
```vue
<template>
  <div class="rudder-card">
    <h3>{{ rudder.name }}</h3>
    <div :class="statusClass">{{ rudder.status }}</div>
    <button @click="handleStart">Start</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Rudder } from '@nakhoda/shared/types';

interface Props {
  rudder: Rudder;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  command: [action: string];
  update: [rudder: Rudder];
}>();

const statusClass = computed(() => ({
  'status--online': props.rudder.status === 'online',
  'status--offline': props.rudder.status === 'offline',
}));

const handleStart = () => {
  emit('command', 'start');
};
</script>

<style scoped>
.rudder-card {
  padding: 1rem;
  border: 1px solid #ccc;
}

.status--online {
  color: green;
}

.status--offline {
  color: red;
}
</style>
```

### Composables (Hooks)
```typescript
// ✅ DO: Prefix with `use`
export function useAuth() {
  const auth = inject('auth');
  return {
    isAuthenticated: computed(() => !!auth.token),
    logout: () => auth.clearToken(),
  };
}

// ✅ DO: Return reactive state + methods
export function usePagination(items: Ref<any[]>, pageSize = 50) {
  const currentPage = ref(1);
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    return items.value.slice(start, start + pageSize);
  });
  return { currentPage, paginatedItems, totalPages: computed(() => Math.ceil(items.value.length / pageSize)) };
}
```

---

## Backend (Express + Node.js)

### Route Handlers
```typescript
// ✅ DO: Use async/await, typed requests
import { Router, Request, Response, NextFunction } from 'express';
import { Container } from '@nakhoda/shared/types';

const router = Router();

interface CreateContainerReq {
  rudder_id: string;
  image: string;
  name: string;
  ports?: Record<string, number>;
}

router.post<{}, Container, CreateContainerReq>(
  '/containers/create',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rudder_id, image, name } = req.body;
      const container = await containerService.create(rudder_id, { image, name });
      res.json(container);
    } catch (error) {
      next(error);
    }
  }
);

// ❌ DON'T: Use `any` or untyped responses
router.post('/containers', (req, res) => {
  res.json(req.body); // Bad
});
```

### Services (Business Logic)
```typescript
// ✅ DO: Encapsulate logic in services
export class ContainerService {
  constructor(private db: PostgresClient, private redis: RedisClient) {}

  async create(rudderId: string, opts: CreateOpts): Promise<Container> {
    // Validate rudder exists
    const rudder = await this.redis.get(`rudder:${rudderId}:session`);
    if (!rudder) throw new Error('Rudder not found');

    // Create job in DB
    const job = await this.db.jobs.insert({
      rudder_id: rudderId,
      action: JOB_ACTIONS.CONTAINER_CREATE,
      params: opts,
      status: JobStatus.PENDING,
    });

    // Dispatch to rudder via WebSocket
    this.io.to(rudderId).emit('wheel:job_dispatch', job);

    return job;
  }
}

// ❌ DON'T: Mix route logic + business logic
router.post('/containers', async (req, res) => {
  // Bad: business logic in route
  const rudder = await db.query('SELECT * FROM rudders...');
  // ...
});
```

### Database Queries
```typescript
// ✅ DO: Use parameterized queries (prevent SQL injection)
const job = await db.query(
  'SELECT * FROM jobs WHERE id = $1 AND status = $2',
  [jobId, JobStatus.PENDING]
);

// ✅ DO: Return typed results
async function getJob(jobId: string): Promise<Job | null> {
  const result = await db.query<Job>(
    'SELECT * FROM jobs WHERE id = $1',
    [jobId]
  );
  return result.rows[0] || null;
}

// ❌ DON'T: String concatenation (SQL injection risk!)
const job = await db.query(`SELECT * FROM jobs WHERE id = '${jobId}'`); // Bad
```

### Error Handling
```typescript
// ✅ DO: Define custom error classes
export class RudderNotFoundError extends Error {
  constructor(rudderId: string) {
    super(`Rudder ${rudderId} not found`);
    this.name = 'RudderNotFoundError';
  }
}

// ✅ DO: Use error middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof RudderNotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal Server Error' });
});
```

---

## WebSocket Events

### Event Format
```typescript
// ✅ DO: Use typed event payloads
io.on('connection', (socket) => {
  socket.on('rudder:register', (payload: RudderRegisterPayload) => {
    // payload type-checked
  });

  socket.emit('wheel:ack', { timestamp: Date.now() });
});

// Event types in shared/types/websocket.ts
export interface RudderRegisterPayload {
  token: string;
  hostname: string;
  dockerVersion: string;
}

export interface WheelAckPayload {
  timestamp: number;
}
```

---

## Testing

### Unit Tests
```typescript
// ✅ DO: Test pure functions, services
describe('ContainerService', () => {
  it('should create container and dispatch job', async () => {
    const service = new ContainerService(mockDb, mockRedis);
    const container = await service.create('rudder_1', { image: 'nginx' });
    expect(container.status).toBe('pending');
  });
});

// ✅ DO: Name test files as `*.test.ts`
// ✅ DO: Use jest or vitest
```

### Integration Tests
```typescript
// ✅ DO: Test API endpoints
describe('POST /api/containers/create', () => {
  it('should accept valid request and return job', async () => {
    const res = await request(app)
      .post('/api/containers/create')
      .send({ rudder_id: 'rudder_1', image: 'nginx' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
  });
});
```

---

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body (optional)>
<footer (optional)>
```

### Examples
```
feat(wheel-be): add job queue processing
fix(wheel-fe): fix rudder list not refreshing on heartbeat
docs: update API contract v1
refactor(shared): extract types to separate files
test(rudder): add docker socket integration tests
```

### Types
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `refactor` — Code reorganization (no feature/fix)
- `test` — Test additions
- `chore` — Build, config, deps

---

## Code Review Checklist

- [ ] TypeScript strict mode enabled + no `any` types
- [ ] All functions have type annotations
- [ ] No hardcoded strings (use constants)
- [ ] Error handling for async operations
- [ ] Test coverage for critical paths
- [ ] Commit messages follow convention
- [ ] No console.log (use logger)
- [ ] No unused imports/variables

---
