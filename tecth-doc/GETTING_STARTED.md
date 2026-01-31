# Getting Started with Nakhoda 🚀

Quick start guide to run Nakhoda locally with Docker Compose.

---

## Prerequisites

- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Git** (to clone the project)

Verify installation:
```bash
docker --version
docker compose --version
```

---

## Quick Start (< 5 minutes)

### 1. Start All Services

```bash
cd /path/to/Nakhoda
docker compose -f dev-compose.yml up -d
```

This command will start all **5 services** in detached mode:
- ✅ PostgreSQL 16 (Database) — port 5432
- ✅ Redis 7 (Cache) — port 6379
- ✅ Wheel-BE (Backend API + WebSocket) — ports 3000 & 8080
- ✅ Wheel-FE (Frontend UI) — port 5173
- ✅ Rudder-1 (Docker Agent) — for local testing

**Expected output**:
```
[+] up 5/5
 ✔ Container nakhoda-postgres   Healthy
 ✔ Container nakhoda-redis      Healthy
 ✔ Container nakhoda-wheel-be   Running
 ✔ Container nakhoda-wheel-fe   Running
 ✔ Container nakhoda-rudder-1   Running
```

### 2. Wait for Initialization

The first startup takes ~10 seconds for database initialization:

```bash
docker compose -f dev-compose.yml ps
```

All services should show `Up` status.

### 3. Access the Application

Open your browser and navigate to:

🌐 **Frontend**: [http://localhost:5173](http://localhost:5173)

You should see the Nakhoda login page.

### 4. Login

**Default Credentials**:
- Username: `admin`
- Password: `admin`

After login, you'll access the dashboard to manage Docker hosts (Rudders).

---

## Service Details

### Frontend (Wheel-FE)

- **Tech**: Vue 3 + Vite + Ant Design Vue
- **URL**: http://localhost:5173
- **Hot Reload**: ✅ Enabled (auto-refresh on file changes)
- **Features**: Dashboard, Container management, Image browser, Volume manager

### Backend (Wheel-BE)

- **Tech**: Node.js + Express + Socket.io
- **HTTP API**: http://localhost:3000/api
- **WebSocket**: ws://localhost:8080
- **Hot Reload**: ✅ Enabled (tsx watch)
- **Requires JWT Token**: See [API.md](API.md) for authentication

### Database (PostgreSQL)

- **Tech**: PostgreSQL 16-Alpine
- **Host**: localhost:5432
- **Credentials**:
  - User: `nakhoda`
  - Password: `nakhoda`
  - Database: `nakhoda`
- **Schema**: Auto-initialized from [postgres/init.sql](../postgres/init.sql)
- **Persistence**: Stored in Docker volume `postgres_data`

### Cache (Redis)

- **Tech**: Redis 7-Alpine
- **Host**: localhost:6379
- **Purpose**: Session storage, container snapshots caching
- **Persistence**: RDB + AOF enabled
- **Data Location**: Docker volume `redis_data`

### Docker Agent (Rudder-1)

- **Tech**: Node.js WebSocket client
- **Purpose**: Local Docker host testing and development
- **Socket Access**: Mounts `/var/run/docker.sock` for Docker API calls
- **Connection**: Auto-connects to wheel-be on startup

---

## Common Tasks

### Stop Services

```bash
docker compose -f dev-compose.yml stop
```

Services remain in memory. Restart with `up -d`.

### Stop & Remove Containers

```bash
docker compose -f dev-compose.yml down
```

Data persists in volumes.

### Reset Everything (⚠️ Data Loss)

```bash
docker compose -f dev-compose.yml down -v
```

This removes containers, network, and volumes. Fresh start on next `up -d`.

### View Live Logs

```bash
# All services
docker compose -f dev-compose.yml logs -f

# Specific service
docker compose -f dev-compose.yml logs -f wheel-be
docker compose -f dev-compose.yml logs -f wheel-fe
docker compose -f dev-compose.yml logs -f postgres
```

### Connect to PostgreSQL

```bash
docker exec -it nakhoda-postgres psql -U nakhoda -d nakhoda
```

Inside psql:
```sql
-- List tables
\dt

-- Check admin user
SELECT id, username, role FROM users;

-- Check job queue
SELECT id, rudder_id, action, status FROM jobs LIMIT 10;
```

### Connect to Redis

```bash
docker exec -it nakhoda-redis redis-cli

# Inside redis-cli
> PING
> KEYS *
> GET some_key
```

---

## Environment Configuration

All settings are in the root [.env]../.env) file:

```bash
# Application
NODE_ENV=development

# Ports
PORT=3000
WS_PORT=8080
VITE_PORT=5173

# Database
DB_USER=nakhoda
DB_PASSWORD=nakhoda
DB_NAME=nakhoda

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
RUDDER_TOKENS=rudder_token_1,rudder_token_2
```

**Modify and restart services**:
```bash
# Edit .env
nano .env

# Restart
docker compose -f dev-compose.yml restart wheel-be wheel-fe
```

---

## Troubleshooting

### Frontend Not Loading

**Issue**: Port 5173 shows connection refused

**Solution**:
```bash
# Rebuild frontend image
docker compose -f dev-compose.yml down
docker compose -f dev-compose.yml up -d --build wheel-fe

# Wait 5 seconds
sleep 5

# Test
curl http://localhost:5173
```

### Cannot Login

**Issue**: "Invalid credentials" error

**Steps**:
1. Check database initialization:
   ```bash
   docker compose -f dev-compose.yml logs postgres | tail -10
   ```

2. Verify admin user exists:
   ```bash
   docker exec nakhoda-postgres psql -U nakhoda -d nakhoda \
     -c "SELECT username, role FROM users WHERE username='admin';"
   ```

3. Reset database:
   ```bash
   docker compose -f dev-compose.yml down -v
   docker compose -f dev-compose.yml up -d
   sleep 10
   ```

### API Returns 401 Unauthorized

**Issue**: POST requests fail with `No authorization header`

**Solution**: Frontend needs to obtain JWT token via `/api/auth/login` endpoint. See [API.md](API.md#authentication) for details.

### Rudder Not Connecting

**Issue**: Rudder-1 logs show "Connection error"

**Check**:
```bash
# View rudder logs
docker logs nakhoda-rudder-1

# Verify wheel-be WebSocket is running
docker logs nakhoda-wheel-be | grep -i websocket

# Check network connectivity
docker exec nakhoda-rudder-1 telnet wheel-be 8080
```

### Port Already in Use

**Issue**: Port 5173/3000 already in use

**Solution**:
```bash
# Find what's using the port
lsof -i :5173

# Kill the process or change port in .env
PORT=3001
VITE_PORT=5174
```

---

## Development Workflow

### File Changes Auto-Reload

Both frontend and backend have hot reload enabled:

- **Frontend** (Vite): Edit `/wheel-fe/src/**` → Changes appear instantly
- **Backend** (tsx): Edit `/wheel-be/src/**` → Automatic restart

No need to restart containers!

### Debug Frontend

1. Open browser DevTools: `F12` or `Cmd+Option+I`
2. Check **Console** for errors
3. **Network** tab to see API calls
4. **Vue DevTools** extension recommended

### Debug Backend

```bash
# View API logs
docker compose -f dev-compose.yml logs -f wheel-be

# Search for specific message
docker compose -f dev-compose.yml logs wheel-be | grep "ERROR"
```

### Test API Endpoints

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Response includes token
# Use in subsequent requests:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/rudders
```

---

## Next Steps

1. ✅ Services running? → See [Dashboard](../wheel-fe)
2. 📚 Learn the API → See [API.md](API.md)
3. 🏗️ Understand architecture → See [README.md](README.md)
4. 📋 Check conventions → See [CONVENTIONS.md](CONVENTIONS.md)
5. 🗂️ Project structure → See [STRUCTURE.md](STRUCTURE.md)

---

## Getting Help

- **Check logs**: `docker compose -f dev-compose.yml logs -f SERVICE_NAME`
- **Review documentation**: [tecth-doc/](.)
- **Database schema**: [tecth-doc/DATABASE.md](DATABASE.md)
- **API reference**: [tecth-doc/API.md](API.md)

---

**Ready to go!** 🎉 Start building with Nakhoda.
