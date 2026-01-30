# Milestone 2 — Wheel FE (Vue 3)

## Overview
Build the frontend application shell with authentication, navigation, and core UI layouts using Vue 3, Ant Design Vue, and Pinia.

## Tech Stack

- **Node.js 20** + npm
- **Vue 3** (Composition API)
- **Ant Design Vue** (component library)
- **Remixicon** (icon library)
- **Pinia** (state management)
- **Vue Router** (routing)
- **Vite** (build tool)
- **TypeScript** (strict mode)

## Objectives

- [ ] Initialize Vue 3 project with Vite
- [ ] Setup Pinia stores (auth, rudders, containers, images, volumes, jobs, ui)
- [ ] Implement authentication flow (login page + token storage)
- [ ] Build main layout (navbar, sidebar)
- [ ] Create dashboard with rudder status + quick stats
- [ ] Implement rudder list page
- [ ] Implement container list page (table + filters + pagination)
- [ ] Setup WebSocket integration for real-time updates

## Deliverables

### 1. Project Setup
```bash
cd wheel-fe/
npm create vite@latest . -- --template vue-ts
npm install
npm install ant-design-vue remixicon pinia vue-router
npm run dev
```

**Files to create**:
- `vite.config.ts` — Vite config with path aliases
- `tsconfig.json` — TypeScript strict mode
- `src/main.ts` — Entry point
- `src/App.vue` — Root component
- `index.html` — HTML template

### 2. Authentication System

**Composable**: `src/composables/useAuth.ts`
- Login logic
- Token storage (localStorage)
- Session validation

**Page**: `src/pages/Login.vue`
- Token input field
- Submit button
- Error handling + loading state
- Redirect to dashboard on success

**Middleware**: Auth guard in router

### 3. Layout Components

**Component**: `src/components/Layout.vue`
- Main page wrapper
- Sidebar + navbar
- Route outlet

**Component**: `src/components/Navbar.vue`
- Logo + branding
- User profile dropdown
- Logout button
- Theme toggle

**Component**: `src/components/Sidebar.vue`
- Navigation menu
- Route links (dashboard, rudders, containers, images, volumes, jobs, settings)
- Collapse/expand toggle

### 4. Dashboard Page

**Page**: `src/pages/Dashboard.vue`

**Sections**:
1. **Summary Cards** (4 cards in grid)
   - Online rudders count
   - Total containers
   - Pending jobs count
   - Total images

2. **Rudder Status Cards** (horizontal scroll or grid)
   - RudderStatusCard component
   - Show rudder ID, hostname, status (online/offline)
   - Last heartbeat age (e.g., "5 seconds ago")
   - Click to navigate to detail

3. **Recent Jobs** (table preview)
   - Last 5 jobs
   - Columns: job_id, action, rudder, status, created_at
   - Link to full job history

**Pinia Integration**: Load from `useRudders()`, `useContainers()`, `useJobs()`

### 5. Rudder List Page

**Page**: `src/pages/RudderList.vue`

**Table Columns**:
- ID
- Hostname
- Status (badge: green/red)
- Docker Version
- Last Heartbeat
- Actions (view, refresh)

**Features**:
- Filter by status (online/offline)
- Pagination (50 items per page)
- Sort by column
- Link row to detail page

**Component**: `src/components/RudderTable.vue`

### 6. Container List Page

**Page**: `src/pages/ContainerList.vue`

**Table Columns**:
- Name
- Image
- Status (badge: running/stopped/exited)
- Rudder ID
- Ports
- Created
- Actions (start, stop, restart, delete)

**Filters**:
- By status
- By rudder
- By image name

**Pagination**: 50 items per page

**Actions**:
- Inline buttons (start, stop, delete)
- Action dropdown menu
- Confirmation modal for destructive actions

**Component**: `src/components/ContainerTable.vue`
**Component**: `src/components/ContainerActions.vue`

### 7. Pinia Stores

**File**: `src/stores/auth.ts`
- `login(token)` — Authenticate
- `logout()` — Clear session
- `isAuthenticated` — Computed
- `token`, `user` — State

**File**: `src/stores/rudders.ts`
- `getRudders()` — Fetch all
- `updateRudderStatus(id, status)` — Real-time update
- `onlineRudders`, `offlineRudders` — Computed
- `rudders[]` — State

**File**: `src/stores/containers.ts`
- `getContainers()` — Fetch all
- `filters`, `page`, `pageSize` — State
- `filteredContainers`, `paginatedContainers` — Computed
- `setFilters()`, `setPage()` — Actions
- `updateContainerStatus()` — Real-time update

**File**: `src/stores/images.ts`
- `getImages()` — Fetch all
- `pullImage()` — Pull new image
- `deleteImage()` — Delete image

**File**: `src/stores/volumes.ts`
- `getVolumes()` — Fetch all
- `deleteVolume()` — Delete volume

**File**: `src/stores/jobs.ts`
- `getJobs()` — Fetch history
- `filters`, `page` — State
- `paginatedJobs` — Computed

**File**: `src/stores/ui.ts`
- `theme` — 'light' | 'dark'
- `sidebarOpen` — Boolean
- `notifications[]` — Array
- `addNotification()`, `removeNotification()` — Methods

### 8. WebSocket Integration

**Composable**: `src/composables/useWebSocket.ts`
- Connect to `WS_URL`
- Listen for broadcasts
- Update stores on events

**Events**:
- `broadcast:rudder_online` → update rudder status
- `broadcast:rudder_offline` → update rudder status
- `broadcast:containers_updated` → refresh container list
- `broadcast:job_complete` → show notification

**Auto-initialization**: Setup in `App.vue` onMounted

### 9. Reusable Components

**Common Components**:
- `src/components/common/Button.vue`
- `src/components/common/Modal.vue`
- `src/components/common/Table.vue` (wrapper around Ant Design)
- `src/components/common/Pagination.vue`
- `src/components/common/Loading.vue`
- `src/components/common/Badge.vue`

**Widget Components**:
- `src/components/widgets/RudderStatusCard.vue`
- `src/components/widgets/SummaryCard.vue`
- `src/components/widgets/JobSummary.vue`

### 10. Router Setup

**File**: `src/router.ts`
- Route definitions (see [ROUTES.md](ROUTES.md))
- Auth guard
- Layout wrapper

### 11. Styling

- **Theme**: Light/dark mode toggle
- **CSS Modules**: Component-scoped styles
- **Ant Design Customization**: CSS variables for theming
- **Icons**: Remixicon for all icons

**File**: `src/style/global.css`
- CSS variables (colors, spacing, fonts)
- Global resets

### 12. Utilities

**File**: `src/utils/api.ts`
- Fetch wrapper with error handling
- Base URL from env
- Auth header injection

**File**: `src/utils/format.ts`
- `formatDate()`
- `formatBytes()`
- `formatDuration()`

**File**: `src/utils/validate.ts`
- `validateToken()`
- `validateImageName()`

## Development Checklist

- [ ] Project initialized with Vite
- [ ] Dependencies installed (Vue 3, Pinia, Router, Ant Design Vue, Remixicon)
- [ ] TypeScript strict mode configured
- [ ] Path aliases configured (`@/` for src)
- [ ] Pinia stores created
- [ ] Router configured with auth guard
- [ ] Layout component built
- [ ] Login page functional
- [ ] Dashboard page functional
- [ ] Rudder list page functional
- [ ] Container list page functional
- [ ] WebSocket integration working
- [ ] Real-time updates flowing
- [ ] Theme toggle functional
- [ ] Notifications system working
- [ ] Error handling + user feedback
- [ ] All pages styled with Ant Design
- [ ] Icons integrated (Remixicon)
- [ ] Dev server runs without errors

## Completion Criteria

✅ FE shell complete  
✅ All pages render  
✅ Login flow works  
✅ Navigation functional  
✅ Real-time updates via WebSocket  
✅ State management via Pinia  
✅ Styling consistent (Ant Design)  
✅ No console errors  

## Next Steps

→ **Milestone 3**: Build Wheel BE (Node.js API + WebSocket server)

---
