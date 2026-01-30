import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Container } from '@nakhoda/shared/types';
import { apiDelete, apiGet, apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useContainers = defineStore('containers', () => {
  const containers = ref<Container[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({ status: '', rudder: '', image: '' });
  const page = ref(1);
  const pageSize = 50;

  const filteredContainers = computed(() => {
    return containers.value.filter((c: Container) => {
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
      const response = await apiGet<Container[]>(API_ENDPOINTS.CONTAINERS.LIST);
      containers.value = response;
      page.value = 1;
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      loading.value = false;
    }
  };

  const createContainer = async (opts: Record<string, unknown>) => {
    try {
      const response = await apiPost<Container>(API_ENDPOINTS.CONTAINERS.CREATE, opts);
      containers.value.push(response);
      return response;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    }
  };

  const deleteContainer = async (id: string) => {
    await apiDelete(API_ENDPOINTS.CONTAINERS.DELETE(id));
    containers.value = containers.value.filter((c: Container) => c.id !== id);
  };

  const updateContainerStatus = (
    containerId: string,
    status: 'running' | 'stopped' | 'exited'
  ) => {
    const container = containers.value.find((c: Container) => c.id === containerId);
    if (container) {
      container.status = status;
    }
  };

  const updateContainerList = (items: Container[]) => {
    containers.value = items;
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
    deleteContainer,
    updateContainerStatus,
    updateContainerList,
    setFilters,
    setPage,
  };
});
