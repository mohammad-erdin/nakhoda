export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  RUDDERS: {
    LIST: '/api/rudders',
    GET: (id: string) => `/api/rudders/${id}`,
    HEALTH: (id: string) => `/api/rudders/${id}/health`,
  },
  CONTAINERS: {
    LIST: '/api/containers',
    CREATE: '/api/containers/create',
    START: (id: string) => `/api/containers/${id}/start`,
    STOP: (id: string) => `/api/containers/${id}/stop`,
    RESTART: (id: string) => `/api/containers/${id}/restart`,
    DELETE: (id: string) => `/api/containers/${id}`,
    DETAIL: (id: string) => `/api/containers/${id}`,
  },
  IMAGES: {
    LIST: '/api/images',
    PULL: '/api/images/pull',
    DELETE: (id: string) => `/api/images/${id}`,
  },
  VOLUMES: {
    LIST: '/api/volumes',
    CREATE: '/api/volumes/create',
    DELETE: (id: string) => `/api/volumes/${id}`,
  },
  JOBS: {
    LIST: '/api/jobs',
    DETAIL: (id: string) => `/api/jobs/${id}`,
    RETRY: (id: string) => `/api/jobs/${id}/retry`,
  },
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
  },
} as const;
