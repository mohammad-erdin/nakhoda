# Frontend Routes & Page Structure

## Frontend Tech Stack (Phase 2)

- Node.js 20 + npm
- Vue 3
- Ant Design Vue
- Remixicon
- Pinia
- Vue Router

## Route Definitions (Vue Router)

```typescript
// wheel-fe/src/router.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Public routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false },
  },

  // Protected routes (require auth)
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },

  // Rudder Management
  {
    path: '/rudders',
    name: 'RudderList',
    component: () => import('@/pages/RudderList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/rudders/:id',
    name: 'RudderDetail',
    component: () => import('@/pages/RudderDetail.vue'),
    meta: { requiresAuth: true },
  },

  // Container Management
  {
    path: '/containers',
    name: 'ContainerList',
    component: () => import('@/pages/ContainerList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/containers/create',
    name: 'ContainerCreate',
    component: () => import('@/pages/ContainerCreate.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/containers/:id',
    name: 'ContainerDetail',
    component: () => import('@/pages/ContainerDetail.vue'),
    meta: { requiresAuth: true },
  },

  // Image Management
  {
    path: '/images',
    name: 'ImageList',
    component: () => import('@/pages/ImageList.vue'),
    meta: { requiresAuth: true },
  },

  // Volume Management
  {
    path: '/volumes',
    name: 'VolumeList',
    component: () => import('@/pages/VolumeList.vue'),
    meta: { requiresAuth: true },
  },

  // Job History
  {
    path: '/jobs',
    name: 'JobHistory',
    component: () => import('@/pages/JobHistory.vue'),
    meta: { requiresAuth: true },
  },

  // Settings
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { requiresAuth: true },
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach((to, from, next) => {
  const auth = useAuth();
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  if (to.name === 'Login' && auth.isAuthenticated) {
    return next({ name: 'Dashboard' });
  }

  next();
});

export default router;
```

---

## Page Components Breakdown

### `/login`
**File**: `wheel-fe/src/pages/Login.vue`
```vue
<template>
  <div class="login-page">
    <form @submit.prevent="handleLogin">
      <input v-model="token" type="password" placeholder="Enter token">
      <button type="submit" :disabled="loading">Login</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const token = ref('');
const loading = ref(false);
const router = useRouter();
const auth = useAuth();

const handleLogin = async () => {
  loading.value = true;
  try {
    await auth.login(token.value);
    router.push({ name: 'Dashboard' });
  } catch (error) {
    // Show error
  } finally {
    loading.value = false;
  }
};
</script>
```

### `/` — Dashboard
**File**: `wheel-fe/src/pages/Dashboard.vue`
**Displays**:
- Status summary: online rudders, total containers, pending jobs
- Rudder status cards (real-time)
- Quick action buttons (create container, pull image)
- Recent jobs

**Components**:
- `RudderStatusCard.vue` — shows rudder + last heartbeat
- `JobSummary.vue` — counts + status breakdown
- `QuickActions.vue` — create/pull buttons

### `/rudders` — Rudder List
**File**: `wheel-fe/src/pages/RudderList.vue`
**Displays**:
- Table of all rudders (id, hostname, status, docker version, last heartbeat)
- Filter by status (online/offline)
- Pagination

**Components**:
- `RudderTable.vue` — table + inline actions

### `/rudders/:id` — Rudder Detail
**File**: `wheel-fe/src/pages/RudderDetail.vue`
**Displays**:
- Rudder info (hostname, docker version, uptime)
- Containers running on this rudder
- Available actions (refresh, restart agent)

### `/containers` — Container List
**File**: `wheel-fe/src/pages/ContainerList.vue`
**Displays**:
- Table of all containers (across all rudders)
- Columns: name, image, status, rudder, ports, created
- Filter by status, rudder, image
- Pagination
- Inline actions: start, stop, restart, delete

**Components**:
- `ContainerTable.vue` — table + filters
- `ContainerActions.vue` — dropdown menu

### `/containers/create` — Create Container Form
**File**: `wheel-fe/src/pages/ContainerCreate.vue`
**Form Fields**:
- Select rudder (dropdown)
- Image name (autocomplete from pulled images)
- Container name
- Ports mapping (dynamic list)
- Environment variables (key-value list)
- Optional: mount volumes

**On Submit**:
- POST /api/containers/create
- Show loading state
- Redirect to container detail on success

### `/containers/:id` — Container Detail
**File**: `wheel-fe/src/pages/ContainerDetail.vue`
**Displays**:
- Container metadata (id, name, image, status, created, ports, mounts)
- Live logs (if running)
- Action buttons (start/stop/restart/delete)
- Environment variables
- Resource usage (if available)

### `/images` — Image List
**File**: `wheel-fe/src/pages/ImageList.vue`
**Displays**:
- Table of all images (across rudders)
- Columns: repo:tag, size, created, used by (container count)
- Filter by repo
- Actions: delete, inspect

**Pull Image Modal**:
- Input: repository:tag
- Select rudder
- Submit pulls image

### `/volumes` — Volume List
**File**: `wheel-fe/src/pages/VolumeList.vue`
**Displays**:
- Table of all volumes
- Columns: name, driver, mount point, used by
- Actions: delete, inspect

### `/jobs` — Job History
**File**: `wheel-fe/src/pages/JobHistory.vue`
**Displays**:
- Table of jobs (latest first)
- Columns: job_id, action, rudder, status, created_at, completed_at, duration
- Filter: status, rudder, date range
- Pagination
- Click row to see details

### `/settings` — Settings
**File**: `wheel-fe/src/pages/Settings.vue`
**Options**:
- Job retention days (slider)
- Theme (light/dark)
- Logout button

---

## Component Organization

### Layout
- `components/Layout.vue` — main page wrapper
  - `components/Navbar.vue` — top navigation
  - `components/Sidebar.vue` — left menu

### Reusable Components
```
components/
├── common/
│   ├── Button.vue
│   ├── Modal.vue
│   ├── Table.vue
│   ├── Pagination.vue
│   └── Loading.vue
├── forms/
│   ├── ContainerForm.vue
│   ├── ImagePullForm.vue
│   └── VolumeForm.vue
└── widgets/
    ├── RudderStatusCard.vue
    ├── ContainerCard.vue
    └── JobSummary.vue
```

---

## Data Flow (Request → Display)

```
User clicks "List Containers"
  ↓
Router navigates to /containers
  ↓
ContainerList.vue mounts
  ↓
useContainers() composable loads:
  - Calls: GET /api/containers
  - Updates store: containers[]
  ↓
Template renders ContainerTable with containers[]
  ↓
WebSocket 'broadcast:containers_updated' event
  ↓
Store updates containers[]
  ↓
Table re-renders in real-time
```

---
