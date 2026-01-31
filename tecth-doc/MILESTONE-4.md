# Milestone 4 — Rudder Agent

## Overview
Build the Docker agent that runs on each Docker host, connects to Wheel via WebSocket, executes Docker commands, and reports status in real-time.

## Tech Stack

- **Node.js 20** + npm
- **Socket.io Client** (connect to wheel)
- **Dockerode** (Docker socket client)
- **TypeScript** (strict mode)

## Objectives

- [ ] Initialize Rudder project
- [ ] Setup WebSocket client connection to Wheel
- [ ] Implement token-based authentication
- [ ] Implement Docker socket integration
- [ ] Implement container management (start, stop, restart, create, delete)
- [ ] Implement image management (pull, list, delete)
- [ ] Implement volume management (create, delete, list)
- [ ] Implement heartbeat + health checks
- [ ] Implement graceful reconnection + backoff
- [ ] Setup logging

## Deliverables

### 1. Project Setup

```bash
cd rudder/
npm init -y
npm install socket.io-client dockerode dotenv
npm install -D typescript @types/node ts-node nodemon
```

**Files to create**:
- `tsconfig.json` — TypeScript config
- `src/index.ts` — Entry point
- `.env.example` — Environment variables

### 2. Configuration

**File**: `src/config.ts`
```typescript
export const config = {
  wheelUrl: process.env.WHEEL_URL, // wss://10.10.1.1:443
  rudderId: process.env.RUDDER_ID, // rudder_1
  token: process.env.RUDDER_TOKEN, // token from .env
  hostname: process.env.RUDDER_HOSTNAME || os.hostname(),
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000'),
  reconnectMaxDelay: parseInt(process.env.RECONNECT_MAX_DELAY_MS || '60000'),
};
```

### 3. WebSocket Client

**File**: `src/client/socketClient.ts`
```typescript
import io from 'socket.io-client';

export class RudderClient {
  private socket: SocketIOClient.Socket;
  private connected = false;
  private reconnectAttempts = 0;

  async connect(): Promise<void>
  disconnect(): void
  on(event: string, handler: (data: any) => void): void
  emit(event: string, data: any): void
  // ...
}
```

**Connection Flow**:
1. Connect to `WHEEL_URL` with query params
2. On connect → emit `rudder:register` with token + hostname
3. On disconnect → log + auto-reconnect with exponential backoff
4. On auth failure → exit process

**Heartbeat**:
- Every 30s → emit `rudder:heartbeat`
- Track last heartbeat received from wheel
- If no ACK > 60s → assume disconnected

### 4. Docker Integration

**File**: `src/docker/client.ts`
```typescript
import Docker from 'dockerode';

export class DockerClient {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async getInfo(): Promise<DockerInfo>
  async listContainers(all?: boolean): Promise<Container[]>
  async getContainer(id: string): Promise<Container>
  async createContainer(opts: CreateOpts): Promise<Container>
  async startContainer(id: string): Promise<void>
  async stopContainer(id: string): Promise<void>
  async restartContainer(id: string): Promise<void>
  async removeContainer(id: string, force?: boolean): Promise<void>
  async listImages(): Promise<Image[]>
  async pullImage(repo: string): Promise<Image>
  async removeImage(id: string, force?: boolean): Promise<void>
  async listVolumes(): Promise<Volume[]>
  async createVolume(opts: CreateVolumeOpts): Promise<Volume>
  async removeVolume(name: string): Promise<void>
}
```

**Error Handling**:
- Catch Docker API errors
- Return structured error responses
- Log all operations

### 5. Job Handler

**File**: `src/jobs/jobHandler.ts`
```typescript
export class JobHandler {
  private docker: DockerClient;

  async executeJob(job: Job): Promise<JobResult>
  // Routes to correct executor based on job.action
}
```

**File**: `src/jobs/executors/`

**Container Executor** (`containers.ts`):
- `execute_container_create(params)` → docker.createContainer + start
- `execute_container_start(params)` → docker.startContainer
- `execute_container_stop(params)` → docker.stopContainer
- `execute_container_restart(params)` → docker.restartContainer
- `execute_container_delete(params)` → docker.removeContainer

**Image Executor** (`images.ts`):
- `execute_image_pull(params)` → docker.pullImage
- `execute_image_delete(params)` → docker.removeImage

**Volume Executor** (`volumes.ts`):
- `execute_volume_create(params)` → docker.createVolume
- `execute_volume_delete(params)` → docker.removeVolume

**Return Format**:
```typescript
{
  jobId: string;
  status: 'done' | 'failed';
  result?: Record<string, any>;
  error?: string;
}
```

### 6. WebSocket Event Handlers

**File**: `src/handlers/wheelEvents.ts`

**`wheel:job_dispatch` Event**:
```typescript
socket.on('wheel:job_dispatch', async (payload: JobDispatchPayload) => {
  try {
    const result = await jobHandler.executeJob(payload);
    socket.emit('rudder:job_complete', result);
  } catch (error) {
    socket.emit('rudder:job_complete', {
      jobId: payload.job_id,
      status: 'failed',
      error: error.message,
    });
  }
});
```

**`wheel:ack` Event**:
```typescript
socket.on('wheel:ack', (payload: AckPayload) => {
  logger.debug('Received ACK from wheel', payload);
  lastAckTime = Date.now();
});
```

### 7. Heartbeat & Health

**File**: `src/health/heartbeat.ts`
```typescript
export class HeartbeatManager {
  private interval: NodeJS.Timer;
  private lastAckTime = Date.now();

  start(): void {
    this.interval = setInterval(() => {
      socket.emit('rudder:heartbeat', { rudder_id });
      
      // Check if we got ACK recently
      if (Date.now() - this.lastAckTime > RUDDER_OFFLINE_THRESHOLD_MS) {
        logger.warn('No ACK from wheel, assuming disconnected');
        socket.disconnect();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    clearInterval(this.interval);
  }
}
```

### 8. Local Job Queue (Buffering)

**File**: `src/queue/localQueue.ts`
```typescript
export class LocalQueue {
  private queue: Job[] = [];
  private maxSize = 100;

  enqueue(job: Job): boolean {
    if (this.queue.length >= this.maxSize) {
      logger.warn('Local queue full, discarding oldest job');
      this.queue.shift();
    }
    this.queue.push(job);
    return true;
  }

  dequeueAll(): Job[] {
    const jobs = [...this.queue];
    this.queue = [];
    return jobs;
  }
}
```

**Use Case**: When Rudder disconnects mid-job, buffer commands locally. On reconnect, replay buffered jobs.

### 9. Logging

**File**: `src/utils/logger.ts`
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'rudder.log' }),
  ],
});
```

**Log Examples**:
```
[INFO] Rudder started: rudder_1
[INFO] Connected to Wheel: wss://10.10.1.1:443
[DEBUG] Received job: container.create (job_123)
[INFO] Container created: container_abc (5.2s)
[WARN] Container creation failed: image not found
[ERROR] Connection lost to Wheel, reconnecting...
[DEBUG] Heartbeat sent
```

### 10. Entry Point

**File**: `src/index.ts`
```typescript
import { RudderClient } from './client/socketClient';
import { DockerClient } from './docker/client';
import { JobHandler } from './jobs/jobHandler';
import { HeartbeatManager } from './health/heartbeat';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  logger.info(`Starting Rudder: ${config.rudderId}`);

  const client = new RudderClient();
  const docker = new DockerClient();
  const jobHandler = new JobHandler(docker);
  const heartbeat = new HeartbeatManager(client);

  await client.connect();
  heartbeat.start();

  client.on('wheel:job_dispatch', async (payload) => {
    const result = await jobHandler.executeJob(payload);
    client.emit('rudder:job_complete', result);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down gracefully...');
    heartbeat.stop();
    client.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
```

### 11. Docker Compose for Rudder

**File**: `rudder/docker-compose.yml`
```yaml
version: '3.8'
services:
  rudder:
    build: .
    container_name: nakhoda-rudder
    environment:
      WHEEL_URL: wss://10.10.1.1:443
      RUDDER_TOKEN: token_rudder_1
      RUDDER_ID: rudder_1
      RUDDER_HOSTNAME: docker-host-1
      LOG_LEVEL: info
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    networks:
      - host
```

### 12. Dockerfile for Rudder

**File**: `rudder/Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env .env

CMD ["node", "dist/index.js"]
```

## Implementation Pattern

Each job executor follows this pattern:

```typescript
async executeContainerCreate(params): Promise<JobResult> {
  try {
    logger.info(`Creating container: ${params.name}`);
    
    const container = await this.docker.createContainer({
      Image: params.image,
      name: params.name,
      ExposedPorts: params.ports || {},
      Env: Object.entries(params.env || {}).map(([k, v]) => `${k}=${v}`),
      // ...
    });

    await container.start();

    logger.info(`Container created: ${container.id}`);
    return {
      status: 'done',
      result: {
        containerId: container.id,
        name: params.name,
      },
    };
  } catch (error) {
    logger.error(`Failed to create container: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}
```

## Development Checklist

- [ ] Rudder project initialized
- [ ] TypeScript configured
- [ ] Socket.io client working
- [ ] Docker socket integration working
- [ ] WebSocket connection to Wheel functional
- [ ] Token authentication working
- [ ] Heartbeat system working
- [ ] Container operations implemented
- [ ] Image operations implemented
- [ ] Volume operations implemented
- [ ] Job executor routing working
- [ ] Error handling global
- [ ] Logging structured
- [ ] Graceful reconnection working
- [ ] Local queue buffering working
- [ ] Docker Compose for Rudder working
- [ ] Can run as container with mounted socket
- [ ] Handles SIGTERM gracefully

## Completion Criteria

✅ Rudder connects to Wheel  
✅ Receives job dispatch  
✅ Executes Docker commands  
✅ Reports status back to Wheel  
✅ Auto-reconnects on disconnect  
✅ Handles errors gracefully  
✅ Logs all operations  

## Next Steps

→ **Milestone 5**: Implement Job System (PostgreSQL queue + job persistence + retention)

---
