# Frontend State Model (Pinia Stores)

## Frontend Tech Stack (Phase 2)

- Node.js 20 + npm
- Vue 3
- Ant Design Vue
- Remixicon
- Pinia
- Vue Router

## Store Architecture

```typescript
// wheel-fe/src/stores/index.ts
export { useAuth } from './auth';
export { useRudders } from './rudders';
export { useContainers } from './containers';
export { useImages } from './images';
export { useVolumes } from './volumes';
export { useJobs } from './jobs';
export { useUI } from './ui';
```

---

## Auth Store

```typescript
// wheel-fe/src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface AuthState {
  token: string | null;
  user: { id: string; name: string } | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const user = ref<AuthState['user']>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (inputToken: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inputToken }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      token.value = inputToken;
      user.value = data.user;
      localStorage.setItem('auth_token', inputToken);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  };

  return { token, user, isAuthenticated, isLoading, error, login, logout };
});
```

---

## Rudders Store

```typescript
// wheel-fe/src/stores/rudders.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Rudder } from '@nakhoda/shared/types';

export const useRudders = defineStore('rudders', () => {
  const rudders = ref<Rudder[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedRudderId = ref<string | null>(null);

  const selectedRudder = computed(() =>
    rudders.value.find((r) => r.id === selectedRudderId.value)
  );

  const onlineRudders = computed(() =>
    rudders.value.filter((r) => r.status === 'online')
  );

  const offlineRudders = computed(() =>
    rudders.value.filter((r) => r.status === 'offline')
  );

  const getRudders = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/rudders');
      if (!response.ok) throw new Error('Failed to fetch rudders');
      rudders.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const updateRudderStatus = (rudderId: string, status: 'online' | 'offline') => {
    const rudder = rudders.value.find((r) => r.id === rudderId);
    if (rudder) {
      rudder.status = status;
      rudder.lastHeartbeat = new Date();
    }
  };

  const setSelectedRudder = (rudderId: string | null) => {
    selectedRudderId.value = rudderId;
  };

  return {
    rudders,
    selectedRudder,
    onlineRudders,
    offlineRudders,
    loading,
    error,
    getRudders,
    updateRudderStatus,
    setSelectedRudder,
  };
});
```

---

## Containers Store

```typescript
// wheel-fe/src/stores/containers.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Container } from '@nakhoda/shared/types';

export const useContainers = defineStore('containers', () => {
  const containers = ref<Container[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({ status: '', rudder: '', image: '' });
  const page = ref(1);
  const pageSize = 50;

  const filteredContainers = computed(() => {
    return containers.value.filter((c) => {
      if (filters.value.status && c.status !== filters.value.status) return false;
      if (filters.value.rudder && c.rudderId !== filters.value.rudder) return false;
      if (filters.value.image && !c.image.includes(filters.value.image)) return false;
      return true;
    });
  });

  const paginatedContainers = computed(() => {
    const start = (page.value - 1) * pageSize;
    return filteredContainers.value.slice(start, start + pageSize);
  });

  const totalPages = computed(() =>
    Math.ceil(filteredContainers.value.length / pageSize)
  );

  const getContainers = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/containers');
      if (!response.ok) throw new Error('Failed to fetch containers');
      containers.value = await response.json();
      page.value = 1;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createContainer = async (opts: any) => {
    try {
      const response = await fetch('/api/containers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!response.ok) throw new Error('Failed to create container');
      const newContainer = await response.json();
      containers.value.push(newContainer);
      return newContainer;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const updateContainerStatus = (
    containerId: string,
    status: 'running' | 'stopped' | 'exited'
  ) => {
    const container = containers.value.find((c) => c.id === containerId);
    if (container) {
      container.status = status;
    }
  };

  const removeContainer = (containerId: string) => {
    containers.value = containers.value.filter((c) => c.id !== containerId);
  };

  const setFilters = (newFilters: typeof filters.value) => {
    filters.value = { ...filters.value, ...newFilters };
    page.value = 1;
  };

  const setPage = (newPage: number) => {
    page.value = Math.max(1, Math.min(newPage, totalPages.value));
  };

  return {
    containers,
    filteredContainers,
    paginatedContainers,
    loading,
    error,
    page,
    totalPages,
    filters,
    getContainers,
    createContainer,
    updateContainerStatus,
    removeContainer,
    setFilters,
    setPage,
  };
});
```

---

## Images Store

```typescript
// wheel-fe/src/stores/images.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Image } from '@nakhoda/shared/types';

export const useImages = defineStore('images', () => {
  const images = ref<Image[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({ repo: '', rudder: '' });

  const filteredImages = computed(() => {
    return images.value.filter((img) => {
      if (filters.value.repo && !img.repo.includes(filters.value.repo))
        return false;
      if (filters.value.rudder && img.rudderId !== filters.value.rudder)
        return false;
      return true;
    });
  });

  const getImages = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/images');
      images.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const pullImage = async (rudderId: string, repo: string) => {
    try {
      const response = await fetch('/api/images/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rudder_id: rudderId, repo }),
      });
      if (!response.ok) throw new Error('Failed to pull image');
      return await response.json();
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
      images.value = images.value.filter((img) => img.id !== imageId);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    images,
    filteredImages,
    loading,
    error,
    filters,
    getImages,
    pullImage,
    deleteImage,
  };
});
```

---

## Volumes Store

```typescript
// wheel-fe/src/stores/volumes.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Volume } from '@nakhoda/shared/types';

export const useVolumes = defineStore('volumes', () => {
  const volumes = ref<Volume[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getVolumes = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/volumes');
      volumes.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const deleteVolume = async (volumeId: string) => {
    try {
      await fetch(`/api/volumes/${volumeId}`, { method: 'DELETE' });
      volumes.value = volumes.value.filter((v) => v.id !== volumeId);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return { volumes, loading, error, getVolumes, deleteVolume };
});
```

---

## Jobs Store

```typescript
// wheel-fe/src/stores/jobs.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Job } from '@nakhoda/shared/types';

export const useJobs = defineStore('jobs', () => {
  const jobs = ref<Job[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({ status: '', rudder: '' });
  const page = ref(1);
  const pageSize = 50;

  const filteredJobs = computed(() => {
    return jobs.value.filter((j) => {
      if (filters.value.status && j.status !== filters.value.status) return false;
      if (filters.value.rudder && j.rudderId !== filters.value.rudder) return false;
      return true;
    });
  });

  const paginatedJobs = computed(() => {
    const start = (page.value - 1) * pageSize;
    return filteredJobs.value.slice(start, start + pageSize);
  });

  const getJobs = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/jobs');
      jobs.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const updateJobStatus = (jobId: string, status: string) => {
    const job = jobs.value.find((j) => j.id === jobId);
    if (job) job.status = status;
  };

  return {
    jobs,
    filteredJobs,
    paginatedJobs,
    loading,
    error,
    filters,
    page,
    getJobs,
    updateJobStatus,
  };
});
```

---

## UI Store (Theme, Notifications)

```typescript
// wheel-fe/src/stores/ui.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useUI = defineStore('ui', () => {
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as any) || 'light'
  );
  const sidebarOpen = ref(true);
  const notifications = ref<Notification[]>([]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const addNotification = (notif: Omit<Notification, 'id'>) => {
    const id = Math.random().toString();
    const notification: Notification = { ...notif, id };
    notifications.value.push(notification);

    if (notif.duration !== -1) {
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== id);
      }, notif.duration || 3000);
    }
  };

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  return {
    theme,
    sidebarOpen,
    notifications,
    setTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
  };
});
```

---

## WebSocket Integration

```typescript
// wheel-fe/src/composables/useWebSocket.ts
import { useRudders } from '@/stores/rudders';
import { useContainers } from '@/stores/containers';
import { useUI } from '@/stores/ui';

export function useWebSocket() {
  const rudders = useRudders();
  const containers = useContainers();
  const ui = useUI();

  const socket = io(import.meta.env.FE_WS_URL, {
    auth: { token: useAuth().token },
  });

  socket.on('broadcast:rudder_online', (data) => {
    rudders.updateRudderStatus(data.rudder_id, 'online');
    ui.addNotification({
      message: `Rudder ${data.rudder_id} online`,
      type: 'success',
    });
  });

  socket.on('broadcast:rudder_offline', (data) => {
    rudders.updateRudderStatus(data.rudder_id, 'offline');
  });

  socket.on('broadcast:containers_updated', (data) => {
    containers.getContainers(); // Refresh
  });

  socket.on('broadcast:job_complete', (data) => {
    ui.addNotification({
      message: `Job ${data.job_id} completed`,
      type: 'success',
    });
  });

  return { socket };
}
```

---
