import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Volume } from '@nakhoda/shared/types';
import { apiDelete, apiGet, apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useVolumes = defineStore('volumes', () => {
	const volumes = ref<Volume[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const getVolumes = async (rudderId?: string) => {
		loading.value = true;
		error.value = null;
		try {
			const url = rudderId ? `${API_ENDPOINTS.VOLUMES.LIST}?rudder_id=${encodeURIComponent(rudderId)}` : API_ENDPOINTS.VOLUMES.LIST;
			const response = await apiGet<any>(url);
			// Handle both direct array and paginated response
			volumes.value = Array.isArray(response) ? response : (response.items || []);
		} catch (err) {
			error.value = (err as Error).message;
		} finally {
			loading.value = false;
		}
	};

	const createVolume = async (payload: { rudder_id: string; name: string }) => {
		try {
			return await apiPost(API_ENDPOINTS.VOLUMES.CREATE, payload);
		} catch (err) {
			error.value = (err as Error).message;
			throw err;
		}
	};

	const deleteVolume = async (id: string) => {
		await apiDelete(API_ENDPOINTS.VOLUMES.DELETE(id));
		volumes.value = volumes.value.filter((v: Volume) => v.id !== id);
	};

	return { volumes, loading, error, getVolumes, createVolume, deleteVolume };
});
