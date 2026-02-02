import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Container } from '@nakhoda/shared/types';
import { apiDelete, apiGet, apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useContainers = defineStore('containers', () => {
	const containers = ref<Container[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const filters = ref({ status: '', rudder: '', searchText: '' });
	const page = ref(1);
	const pageSize = 50;

	const filteredContainers = computed(() => containers.value.filter((c: Container) => {
		if (filters.value.status && c.status !== filters.value.status) return false;
		if (filters.value.rudder && c.rudderId !== filters.value.rudder) return false;
		// if (filters.value.searchText && !c.image.includes(filters.value.searchText)) return false;
		return true;
	}));

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
			const response = await apiGet<any>(API_ENDPOINTS.CONTAINERS.LIST);
			// Handle both direct array and paginated response
			containers.value = Array.isArray(response) ? response : (response.items || []);
			page.value = 1;
		} catch (err) {
			error.value = (err as Error).message;
		} finally {
			loading.value = false;
		}
	};

	const createContainer = async (opts: Record<string, unknown>) => {
		try {
			const response = await apiPost<{ jobId: string; status: string }>(API_ENDPOINTS.CONTAINERS.CREATE, opts);
			// Creation is asynchronous. Backend returns a job (jobId,status).
			// Do not add a container to the list here; wait for job completion to update cache.
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

	const stopSelected = async (rudderId: string, ids: string[]) => {
		const results = [] as Array<{ jobId: string; status: string }>;
		for (const id of ids) {
			const res = await apiPost<{ jobId: string; status: string }>(API_ENDPOINTS.CONTAINERS.STOP(id), { rudder_id: rudderId });
			results.push(res);
		}
		return results;
	};

	const startSelected = async (rudderId: string, ids: string[]) => {
		const results = [] as Array<{ jobId: string; status: string }>;
		for (const id of ids) {
			const res = await apiPost<{ jobId: string; status: string }>(API_ENDPOINTS.CONTAINERS.START(id), { rudder_id: rudderId });
			results.push(res);
		}
		return results;
	};

	const destroySelected = async (rudderId: string, ids: string[]) => {
		const results = [] as Array<{ jobId: string; status: string }>;
		for (const id of ids) {
			const res = await apiDelete(`${API_ENDPOINTS.CONTAINERS.DELETE(id)  }?rudder_id=${encodeURIComponent(rudderId)}`);
			results.push(res as any);
		}
		return results;
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
		stopSelected,
		startSelected,
		destroySelected,
		updateContainerStatus,
		updateContainerList,
		setFilters,
		setPage,
	};
});
