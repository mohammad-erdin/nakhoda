# Milestone 6 — Observability & Hardening

## Overview
Add production-ready observability (Prometheus metrics, structured logging), security hardening (input validation, rate limiting, CORS), error tracking, and health checks.

## Objectives

- [ ] Implement Prometheus metrics (jobs, containers, rudders, API latency)
- [ ] Implement structured JSON logging (Winston)
- [ ] Implement error tracking + alerting
- [ ] Implement API rate limiting (token bucket)
- [ ] Implement CORS + security headers
- [ ] Implement input validation middleware
- [ ] Implement health check endpoints
- [ ] Implement graceful shutdown
- [ ] Implement Docker health checks
- [ ] Implement monitoring dashboard (basic UI)

## Deliverables

### 1. Prometheus Metrics

**File**: `wheel-be/src/metrics/prometheus.ts`

**Metrics to Expose**:

```typescript
// Counter: Total jobs by status
export const jobsTotal = new Counter({
  name: 'nakhoda_jobs_total',
  help: 'Total jobs by action and status',
  labelNames: ['action', 'status'],
});

// Histogram: Job duration
export const jobDurationSeconds = new Histogram({
  name: 'nakhoda_job_duration_seconds',
  help: 'Job execution duration in seconds',
  labelNames: ['action', 'status'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
});

// Gauge: Active jobs by rudder
export const activeJobsByRudder = new Gauge({
  name: 'nakhoda_active_jobs_by_rudder',
  help: 'Number of active jobs per rudder',
  labelNames: ['rudder_id'],
});

// Gauge: Connected rudders
export const connectedRudders = new Gauge({
  name: 'nakhoda_connected_rudders',
  help: 'Number of currently connected rudders',
});

// Gauge: Containers by status
export const containersByStatus = new Gauge({
  name: 'nakhoda_containers_by_status',
  help: 'Number of containers by status',
  labelNames: ['rudder_id', 'status'],
});

// Histogram: API request duration
export const apiRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5],
});

// Counter: API requests total
export const apiRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Gauge: PostgreSQL connection pool
export const dbPoolConnections = new Gauge({
  name: 'nakhoda_db_pool_connections',
  help: 'PostgreSQL connection pool status',
  labelNames: ['state'],
});

// Gauge: Redis connection status
export const redisConnectionStatus = new Gauge({
  name: 'nakhoda_redis_connection_status',
  help: 'Redis connection status (1=connected, 0=disconnected)',
});
```

**Endpoint**: `GET /metrics`
- Returns Prometheus-formatted metrics
- No authentication (protected by firewall/network policy)

**Integration**:
- Track metrics in ServiceLayer (jobService, containerService, etc.)
- Update gauges in WebSocket event handlers
- Track API request duration + status in middleware

### 2. Structured Logging

**File**: `wheel-be/src/logging/logger.ts`

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nakhoda-wheel' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Usage:
logger.info('Container created', { containerId, rudderId, userId });
logger.warn('Job timeout', { jobId, durationSeconds: 300 });
logger.error('Database connection failed', { error: err.message });
```

**Log Schema**:
```json
{
  "timestamp": "2024-01-15 14:23:45",
  "level": "info",
  "message": "Container created",
  "service": "nakhoda-wheel",
  "containerId": "abc123",
  "rudderId": "rudder-1",
  "userId": "user-1",
  "stack": null
}
```

**Structured Fields**:
- `timestamp` — ISO 8601
- `level` — error, warn, info, debug
- `message` — Human-readable description
- `service` — "nakhoda-wheel", "nakhoda-rudder"
- `userId`, `rudderId`, `containerId`, etc. — Context fields
- `stack` — Stack trace if error
- `duration` — Operation duration in ms

### 3. Error Tracking

**File**: `wheel-be/src/errors/errorHandler.ts`

```typescript
export class ErrorTracker {
  async track(error: Error, context: Record<string, any> = {}): Promise<void> {
    // 1. Log to Winston
    logger.error('Error tracked', { error: error.message, stack: error.stack, ...context });

    // 2. If production, send to external service (Sentry/DataDog)
    if (process.env.ERROR_TRACKING_ENABLED === 'true') {
      await this.sendToExternalService(error, context);
    }

    // 3. If critical, send alert
    if (this.isCritical(error)) {
      await this.sendAlert(error, context);
    }
  }

  private isCritical(error: Error): boolean {
    // Define critical errors: database connection lost, Redis down, Rudder crash, etc.
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('Connection timeout') ||
      error.message.includes('Rudder disconnected unexpectedly')
    );
  }

  private async sendAlert(error: Error, context: Record<string, any>): Promise<void> {
    // Send to Slack/PagerDuty/Email
    logger.error('🚨 CRITICAL ERROR', { error: error.message, ...context });
  }
}

export const errorTracker = new ErrorTracker();
```

**Global Error Handler**:

```typescript
// In Express app.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorTracker.track(err, {
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    ip: req.ip,
  });

  res.status(500).json({ error: 'Internal server error' });
});
```

### 4. Rate Limiting

**File**: `wheel-be/src/middleware/rateLimiter.ts`

```typescript
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// Limit: 100 requests per minute per user
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || req.ip;
    await rateLimiter.consume(userId, 1);
    next();
  } catch (rateLimiterRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: (rateLimiterRes as RateLimiterRes).msBeforeNext / 1000,
    });
  }
};

// Apply to all API routes (after auth)
app.use('/api/', authMiddleware, rateLimitMiddleware);
```

**Configuration** (via `.env`):
```
RATE_LIMIT_POINTS=100
RATE_LIMIT_DURATION_SECONDS=60
RATE_LIMIT_ENABLED=true
```

### 5. Security Headers & CORS

**File**: `wheel-be/src/middleware/security.ts`

```typescript
import helmet from 'helmet';
import cors from 'cors';

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

**Environment Variables**:
```
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://nakhoda.example.com
```

### 6. Input Validation Middleware

**File**: `wheel-be/src/middleware/validation.ts`

```typescript
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    req.body = value;
    next();
  };
};

// Usage in routes:
const createContainerSchema = Joi.object({
  image: Joi.string().required().max(255),
  name: Joi.string().required().alphanum().min(3).max(50),
  ports: Joi.array().items(
    Joi.object({
      containerPort: Joi.number().required(),
      hostPort: Joi.number().required(),
      protocol: Joi.string().valid('tcp', 'udp').default('tcp'),
    })
  ),
  envVars: Joi.object().pattern(Joi.string(), Joi.string()),
});

router.post(
  '/',
  authMiddleware,
  validateRequest(createContainerSchema),
  async (req, res) => {
    // req.body is now validated + stripped
  }
);
```

### 7. Health Check Endpoints

**File**: `wheel-be/src/routes/health.ts`

```typescript
// GET /health
router.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /health/ready (readiness check)
router.get('/ready', async (req, res) => {
  try {
    // Check PostgreSQL
    await db.query('SELECT 1');
    // Check Redis
    await redis.ping();
    // Check connected rudders
    const rudderCount = io.sockets.in('rudders').length;

    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
        cache: 'ok',
        rudders: rudderCount > 0 ? 'ok' : 'warning',
        rudderCount,
      },
    });
  } catch (error) {
    res.status(503).json({ status: 'not-ready', error: error.message });
  }
});

// GET /health/live (liveness check)
router.get('/live', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime() });
});
```
### 8. Graceful Shutdown

**File**: `wheel-be/src/server.ts`

```typescript
const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    // Close database connections
    await db.end();
    logger.info('Database connections closed');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    // Close WebSocket connections
    io.close();
    logger.info('WebSocket connections closed');

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  process.emit('SIGTERM');
});
```

### 9. Docker Health Checks

**File**: `docker-compose.yml` (Updated)

```yaml
services:
  wheel-backend:
    build: ./wheel-be
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://admin:admin@postgres:5432/nakhoda
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s

  wheel-frontend:
    build: ./wheel-fe
    ports:
      - "5173:5173"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173"]
      interval: 15s
      timeout: 5s
      retries: 3

  rudder:
    build: ./rudder
    environment:
      - WHEEL_URL=ws://wheel-backend:3000
      - RUDDER_TOKEN=${RUDDER_TOKEN}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - wheel-backend
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### 10. Monitoring Dashboard (Optional)

**File**: `wheel-fe/src/pages/Monitoring.vue`

**Sections**:
1. **System Status** (cards)
   - Wheel status (online/offline)
   - Database status (connected/disconnected)
   - Redis status (connected/disconnected)
   - Rudders (online count)

2. **Metrics** (charts)
   - Job success rate (pie)
   - Job duration histogram (line)
   - Containers per rudder (bar)
   - API latency (line)

3. **Alerts** (timeline)
   - Recent errors (last 100)
   - Warnings
   - Critical events

4. **Logs** (table)
   - Searchable log viewer
   - Filter by level, service, timestamp
   - Copy JSON log button

**Backend Endpoint**: `GET /api/monitoring/metrics` → Return aggregated metrics

## Implementation Checklist

- [ ] Prometheus metrics defined + exposed
- [ ] Winston logger configured
- [ ] Error tracking + alerting setup
- [ ] Rate limiter middleware integrated
- [ ] CORS configured
- [ ] Security headers added
- [ ] Input validation schema created
- [ ] Validation middleware on all routes
- [ ] Health check endpoints (live, ready)
- [ ] Graceful shutdown handler
- [ ] Docker health checks defined
- [ ] Monitoring dashboard created (optional)
- [ ] Metrics scraped by Prometheus (external)
- [ ] Logs collected (ELK stack or similar)
- [ ] Error tracking integrated (Sentry optional)

## Completion Criteria

✅ Prometheus metrics exposed at `/metrics`  
✅ Structured JSON logs in files  
✅ Rate limiting enforced (100 req/min per user)  
✅ CORS allows frontend domain  
✅ All inputs validated before processing  
✅ Health checks pass for Kubernetes  
✅ Graceful shutdown works (30s timeout)  
✅ Docker containers restart on unhealthy  
✅ Errors tracked + logged systematically  
✅ Monitoring dashboard shows system status  

## Next Steps

→ **Post-Launch Hardening**: Security audit, penetration testing, performance tuning, production deployment

---
