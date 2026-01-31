# Nakhoda Project Structure 🏗️

## Directory Layout

```
nakhoda/
├── wheel-fe/                    # Vue 3 Frontend (Vite)
│   ├── src/
│   │   ├── components/          # Reusable Vue components
│   │   ├── pages/               # Page components (Router views)
│   │   ├── stores/              # Pinia state management
│   │   ├── composables/         # Vue 3 composables (hooks)
│   │   ├── utils/               # Helper functions
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile               # Development container
│
├── wheel-be/                    # Node.js Backend (Express)
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic (containers, images, etc)
│   │   ├── db/                  # Database layer (migrations, queries)
│   │   ├── websocket/           # Socket.io handlers
│   │   ├── middleware/          # Auth, logging, error handling
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile               # Development container
│
├── rudder/                      # Docker Agent (Node.js)
│   ├── src/
│   │   ├── docker/              # Docker socket client
│   │   ├── client/              # WebSocket client (connect to wheel)
│   │   └── index.ts             # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── docker-compose.yml       # Standalone rudder deployment
│
├── shared/                      # Shared Types & Constants
│   ├── types/
│   │   ├── index.ts             # Re-export all types
│   │   ├── api.ts               # API request/response types
│   │   ├── entities.ts          # Job, Container, Image, Volume types
│   │   └── websocket.ts         # WebSocket event types
│   ├── constants/
│   │   ├── index.ts
│   │   ├── job-actions.ts       # Job action enums
│   │   ├── endpoints.ts         # API endpoint paths
│   │   └── ws-events.ts         # WebSocket event names
│   └── package.json
│
├── postgres/                    # PostgreSQL Configuration
│   └── init.sql                 # Database schema + seed
│
├── redis/                       # Redis Configuration
│   └── redis.conf               # Redis config (if needed)
│
├── data/                        # Volume mounts (git-ignored)
│   ├── postgres/
│   └── redis/
│
├── tecth-doc/                   # Technical Documentation
│   ├── CONVENTIONS.md           # Naming + structure rules
│   ├── API.md                   # API contract v1
│   ├── DATABASE.md              # Database setup guide
│   ├── STATE-MODEL.md           # Frontend state structure
│   ├── ROUTES.md                # Route definitions
│   ├── README.md                # Blueprint & architecture
│   └── MILESTONE-*.md           # Implementation milestones
│
├── dev-compose.yml              # Development stack (all 4 services)
├── .env                         # Environment variables (all services)
├── .gitignore
└── README.md                    # Project README
```

---

## Key Directories Explained

### `wheel-fe/` — Vue 3 Frontend
- **Vite + TypeScript + Pinia (state)** for fast development
- **components/** → Reusable UI components (Button, Modal, Table, etc)
- **pages/** → Full-page views (login, dashboard, containers, images)
- **stores/** → Pinia stores (auth, rudders, containers, jobs)
- **composables/** → Logic hooks (useWebSocket, useAuth, usePagination)
- **utils/** → Helpers (format, validate, api client)

### `wheel-be/` — Node.js Backend
- **Express + TypeScript + Socket.io**
- **routes/** → HTTP route definitions (POST /api/containers, etc)
- **services/** → Business logic (ContainerService, ImageService, JobService)
- **db/** → Database queries, migrations, connection pool
- **websocket/** → Socket.io event handlers (register, heartbeat, job_complete)
- **middleware/** → Auth (token validation), logging, error handling

### `rudder/` — Docker Agent
- **Simple Node.js client** listening for job commands
- **docker/** → Docker socket client wrapper (executeCommand, getContainers)
- **client/** → WebSocket client (connect, register, listen for jobs)

### `shared/` — Shared NPM Package
- **types/** → TypeScript interfaces (Job, Container, Image, Volume, API requests)
- **constants/** → Enums and hardcoded values (JOB_ACTIONS, WS_EVENTS, API_ENDPOINTS)
- **Published to NPM or local monorepo** (shared across wheel-fe, wheel-be, rudder)

### `postgres/` — PostgreSQL Configuration
- **init.sql** → Database schema initialization + seed data
- Used by `postgres` service in `dev-compose.yml`

### `redis/` — Redis Configuration
- **redis.conf** → Redis configuration (optional)
- Used by `redis` service in `dev-compose.yml`

### `dev-compose.yml` — Development Docker Stack
- **All 5 services**: postgres, redis, wheel-be, wheel-fe, rudder-1
- **Hot reload enabled** for wheel-be and wheel-fe (mounted source directories)
- **Rudder-1**: Included as Docker agent connected to wheel-be for local development
- **Single command startup**: `docker compose -f dev-compose.yml up -d`

### `data/` — Data Volumes
- **postgres/** → PostgreSQL data (git-ignored)
- **redis/** → Redis persistence (git-ignored)

---

## Naming Conventions

### File & Folder Names
- **Directories**: `kebab-case` (e.g., `wheel-fe`, `src/routes`)
- **Components**: `PascalCase` + `.vue` (e.g., `RudderList.vue`, `ContainerTable.vue`)
- **TypeScript files**: `camelCase` + `.ts` (e.g., `containerService.ts`, `usePagination.ts`)
- **Test files**: `*.test.ts` or `*.spec.ts` (colocated with source)

### TypeScript Exports
- **Types/Interfaces**: `PascalCase` (e.g., `Container`, `Job`, `ApiResponse`)
- **Enums**: `PascalCase` (e.g., `JobStatus`, `ContainerAction`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JOB_RETENTION_DAYS`, `WS_HEARTBEAT_INTERVAL`)
- **Functions**: `camelCase` (e.g., `formatDate`, `validateToken`)

### Vue Components
- **File**: `PascalCase.vue` (e.g., `RudderCard.vue`)
- **Props**: `camelCase` (e.g., `rudderStatus`, `onCommand`)
- **Emits**: `camelCase` (e.g., `@update`, `@delete`)
- **Slots**: `camelCase` (e.g., `#header`, `#footer`)

### Routes (React Router style)
- **API**: `/api/{resource}/{action}` (e.g., `/api/containers/create`, `/api/rudders`)
- **FE**: `/dashboard`, `/containers`, `/images`, `/volumes`, `/jobs`, `/settings`

### WebSocket Events
- **Prefix with source**: `wheel:*`, `rudder:*`, `broadcast:*`
- **Format**: `{source}:{entity}:{action}` (e.g., `rudder:register`, `wheel:job_dispatch`)

### Database Tables
- **Names**: `snake_case`, plural (e.g., `jobs`, `job_logs`, `audit_logs`)
- **Columns**: `snake_case` (e.g., `created_at`, `rudder_id`, `job_status`)
- **Primary keys**: `id` (UUID)
- **Foreign keys**: `{entity}_id` (e.g., `job_id`, `rudder_id`)

---

## Module Boundaries

### Wheel FE
- **Owns**: UI state, user interactions, form validation
- **Calls**: Wheel BE REST API + WebSocket
- **Cannot**: Access DB, call rudders directly, manage jobs

### Wheel BE
- **Owns**: API logic, job queue, rudder registry, WebSocket server
- **Calls**: PostgreSQL, Redis, Rudders (via WebSocket)
- **Cannot**: Send UI changes directly (only via WS broadcast)

### Rudder
- **Owns**: Docker socket commands, job execution
- **Calls**: Wheel BE (via WebSocket)
- **Cannot**: Access PostgreSQL, communicate with other rudders

### Shared
- **Owns**: Types + constants only
- **No imports from**: wheel-fe, wheel-be, rudder (one-way dependency)

---

## Environment Variables

### Root `.env` (Unified Configuration)
```bash
# ======================
# APPLICATION
# ======================
NODE_ENV=development

# ======================
# WHEEL-BE (Backend API)
# ======================
PORT=3000
WS_PORT=8080

# ======================
# WHEEL-FE (Frontend)
# ======================
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8080

# ======================
# DATABASE (PostgreSQL)
# ======================
DB_HOST=localhost
DB_PORT=5432
DB_USER=nakhoda
DB_PASSWORD=nakhoda
DB_NAME=nakhoda

# ======================
# REDIS (Cache)
# ======================
REDIS_HOST=localhost
REDIS_PORT=6379

# ======================
# AUTHENTICATION
# ======================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
RUDDER_TOKENS=rudder_token_1,rudder_token_2

# ======================
# JOB SETTINGS
# ======================
JOB_RETENTION_DAYS=30
JOB_TIMEOUT_MS=300000

# ======================
# CORS
# ======================
CORS_ORIGIN=http://localhost:5173

# ======================
# RATE LIMITING
# ======================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Rudder `.env` (For standalone deployment on Docker hosts)
```bash
WHEEL_URL=wss://10.10.1.1:443
RUDDER_TOKEN=rudder_token_1
RUDDER_ID=rudder_1
RUDDER_HOSTNAME=docker-host-1
HEARTBEAT_INTERVAL_MS=30000
RECONNECT_MAX_DELAY_MS=60000
RUDDER_OFFLINE_THRESHOLD_MS=90000
LOG_LEVEL=info
```

> **Note**: For development (in `dev-compose.yml`), rudder-1 uses environment variables from root `.env` with `RUDDER_*` prefixes.

---

## Next Steps
1. **See CONVENTIONS.md** for detailed code style rules
2. **See ROUTES.md** for all frontend route definitions
3. **See STATE-MODEL.md** for Pinia store structure
4. **See API.md** for complete API contract

---
