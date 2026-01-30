# Milestone 1 — Project Structure & Design

## Overview
Establish the complete project foundation with directory structure, naming conventions, and design contracts before any code is written.

## Objectives

- [ ] Define repo layout (wheel-fe, wheel-be, rudder, shared, docs)
- [ ] Define repo layout for services used (redis, postgres, /data)
- [ ] Establish naming conventions + module boundaries
- [ ] Draft UI routes, state model, and API contract (v1)

## Deliverables

### 1. Project Structure
**File**: [STRUCTURE.md](../STRUCTURE.md)

- Complete directory layout for all services
- Key directories explained
- Naming conventions (files, components, routes, database)
- Module boundaries

### 2. Code Conventions
**File**: [docs/CONVENTIONS.md](CONVENTIONS.md)

- TypeScript + General rules
- Vue 3 component structure
- Backend (Express + Node.js) patterns
- WebSocket event format
- Testing conventions
- Commit message standards

### 3. Frontend Routes
**File**: [docs/ROUTES.md](ROUTES.md)

- Complete Vue Router route definitions
- Page components breakdown
- Component organization
- Data flow (request → display)

**Routes**:
- `/login` → Login page
- `/` → Dashboard
- `/rudders` → Rudder list
- `/rudders/:id` → Rudder detail
- `/containers` → Container list
- `/containers/create` → Create form
- `/containers/:id` → Container detail
- `/images` → Image list
- `/volumes` → Volume list
- `/jobs` → Job history
- `/settings` → Settings

### 4. State Model
**File**: [docs/STATE-MODEL.md](STATE-MODEL.md)

- Pinia store architecture
- 7 stores: auth, rudders, containers, images, volumes, jobs, ui
- WebSocket integration composable
- Type-safe state management

### 5. API Contract v1
**File**: [docs/API.md](../docs/API.md)

- Base URL + authentication
- All REST endpoints (Rudders, Containers, Images, Volumes, Jobs, Audit Logs, Settings)
- WebSocket events (client → server, server → client, broadcasts)
- Error response format
- Rate limiting headers

### 6. Shared Types Package
**File**: [docs/SHARED-TYPES.md](SHARED-TYPES.md)

- NPM package structure for `@nakhoda/shared`
- Types: API, entities, WebSocket
- Constants: job-actions, ws-events, endpoints
- No code duplication across services

## Completion Criteria

✅ All files created and documented  
✅ No code yet—design-first approach  
✅ Type definitions stable  
✅ Routes finalized  
✅ API contract locked  
✅ Team alignment on structure  

## Next Steps

→ **Milestone 2**: Build Wheel FE (Vue 3 shell + login + dashboard)

---
