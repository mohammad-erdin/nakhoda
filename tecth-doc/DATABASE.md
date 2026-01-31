# Database Setup Guide

## Quick Start (Local Dev)

### 1. Start All Services (PostgreSQL + Redis + Wheel BE + Wheel FE + Rudder-1)
```bash
docker compose -f dev-compose.yml up -d
```

This will:
- Spin up PostgreSQL 16 on port 5432
- Spin up Redis 7 on port 6379
- Spin up Wheel BE (API + WebSocket) on ports 3000 & 8080
- Spin up Wheel FE (Vue UI) on port 5173
- Spin up Rudder-1 (Docker agent) connected to wheel-be
- Auto-run `init.sql` to initialize schema + seed admin user

### 2. Verify All Services
```bash
docker compose -f dev-compose.yml ps
```

### 3. Check Rudder Connection
```bash
docker logs nakhoda-rudder-1
```

Expected output:
```
[INFO] Connecting to wheel-be at ws://wheel-be:8080
[INFO] Rudder registered: rudder_1
[INFO] Heartbeat sent
```

### 4. Connect to PostgreSQL (optional)
```bash
docker exec -it nakhoda-postgres psql -U nakhoda -d nakhoda
```

Verify admin user:
```sql
SELECT id, username, role FROM users WHERE username = 'admin';
```

---

## Database Schema

### Users
```sql
id (UUID) | username | password_hash | name | role | created_at | updated_at
```

**Roles**: `admin`, `operator`, `viewer`

**Default Admin**:
- Username: `admin`
- Password: `admin`
- Hash: `$2b$10$9h0k.e1I4Y7e5YZ5K5L5h.Wz5c5V5a5M5n5L5j5G5f5D5c5B5A5` (bcrypt)

> **NOTE**: For production, change the password hash immediately!

### Jobs (FIFO Queue)
```sql
id | rudder_id | action | params | status | result | error | created_at | started_at | completed_at
```

**Status**: `pending`, `running`, `done`, `failed`

**Indexes**:
- `(status, created_at DESC)` — Fast FIFO reads
- `(rudder_id, created_at DESC)` — Filter by rudder

### Job Logs (Append-only)
```sql
id | job_id | message | level | created_at
```

**Level**: `info`, `warn`, `error`

Automatically cascades delete with job.

### Audit Logs (Immutable History)
```sql
id | user_id | rudder_id | action | status | params | result | error | ip_address | created_at
```

Used for compliance + debugging.

---

## Environment Variables

**Root `.env`** (used by all services via `dev-compose.yml`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=nakhoda
DB_PASSWORD=nakhoda
DB_NAME=nakhoda

REDIS_HOST=localhost
REDIS_PORT=6379
```

> **Note**: When running inside Docker containers, `DB_HOST` and `REDIS_HOST` are automatically set to service names (`postgres` and `redis`) in the compose file.

---

## Troubleshooting

### PostgreSQL fails to start
```bash
# Check logs
docker compose -f dev-compose.yml logs postgres

# Rebuild
docker compose -f dev-compose.yml down -v
docker compose -f dev-compose.yml up -d
```

### Cannot connect to database
```bash
# Verify container is running
docker ps | grep nakhoda-postgres

# Test connection
docker exec nakhoda-postgres pg_isready -U nakhoda -d nakhoda
```

### Want to reset schema?
```bash
# Delete volumes (⚠️ data loss)
docker compose -f dev-compose.yml down -v

# Recreate
docker compose -f dev-compose.yml up -d
```

---

## Migrations (Future)

For production, use a migration tool (e.g., Flyway, Liquibase, or custom Node script).

For now, manual schema changes are applied to `init.sql` and reinitialized on container restart.

---
