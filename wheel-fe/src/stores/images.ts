import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Image } from '@nakhoda/shared/types';
import { apiDelete, apiGet, apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useImages = defineStore('images', () => {
	const images = ref<Image[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const getImages = async (rudderId?: string) => {
		loading.value = true;
		error.value = null;
		try {
			const url = rudderId ? `${API_ENDPOINTS.IMAGES.LIST}?rudder_id=${encodeURIComponent(rudderId)}` : API_ENDPOINTS.IMAGES.LIST;
			const response = await apiGet<any>(url);
			// Handle both direct array and paginated response
			images.value = Array.isArray(response) ? response : (response.items || []);
		} catch (err) {
			error.value = (err as Error).message;
		} finally {
			loading.value = false;
		}
	};

	const pullImage = async (payload: { rudder_id: string; image: string }) => {
		try {
			return await apiPost(API_ENDPOINTS.IMAGES.PULL, payload);
		} catch (err) {
			error.value = (err as Error).message;
			throw err;
		}
	};

	const deleteImage = async (id: string) => {
		await apiDelete(API_ENDPOINTS.IMAGES.DELETE(id));
		images.value = images.value.filter((img: Image) => img.id !== id);
	};

	return { images, loading, error, getImages, pullImage, deleteImage };
});
