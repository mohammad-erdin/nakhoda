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
│   └── tsconfig.json
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
│   └── .env.example
│
├── rudder/                      # Docker Agent (Node.js)
│   ├── src/
│   │   ├── docker/              # Docker socket client
│   │   ├── client/              # WebSocket client (connect to wheel)
│   │   └── index.ts             # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
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
├── services/                    # Docker Compose Services
│   ├── postgres/
│   │   ├── init.sql             # Database schema + seed
│   │   └── Dockerfile
│   ├── redis/
│   │   └── redis.conf
│   └── docker-compose.yml       # Local dev stack
│
├── data/                        # Volume mounts (git-ignored)
│   ├── postgres/
│   └── redis/
│
├── docs/
│   ├── CONVENTIONS.md           # Naming + structure rules
│   ├── API.md                   # API contract v1
│   ├── STATE-MODEL.md           # Frontend state structure
│   └── ROUTES.md                # Route definitions
│
├── BluePrint.md                 # System architecture
├── STRUCTURE.md                 # This file
├── README.md
├── .gitignore
└── .env.example                 # Root env (if needed)
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

### `services/` — Docker Compose Stack
- **postgres/** → PostgreSQL with init SQL for schema + migrations
- **redis/** → Redis config
- **docker-compose.yml** → Local development stack (all services)

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

### Root `.env.example`
```
ENVIRONMENT=development|production

# Wheel FE
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8080

# Wheel BE
DB_URL=postgres://user:pass@localhost:5432/nakhoda
REDIS_URL=redis://localhost:6379
RUDDER_TOKENS=token_rudder_1,token_rudder_2
JWT_SECRET=your-secret-key
NODE_ENV=development

# Rudder
WHEEL_URL=wss://10.10.1.1:443
RUDDER_TOKEN=token_rudder_1
RUDDER_ID=rudder_1
```

---

## Next Steps
1. **See CONVENTIONS.md** for detailed code style rules
2. **See ROUTES.md** for all frontend route definitions
3. **See STATE-MODEL.md** for Pinia store structure
4. **See API.md** for complete API contract

---
