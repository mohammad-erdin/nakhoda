import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Rudder } from '@nakhoda/shared/types';
import { apiGet } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useRudders = defineStore('rudders', () => {
	const rudders = ref<Rudder[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const selectedRudderId = ref<string | null>(null);

	const selectedRudder = computed(() =>
		rudders.value.find((r: Rudder) => r.id === selectedRudderId.value)
	);

	const onlineRudders = computed(() =>
		rudders.value.filter((r: Rudder) => r.status === 'online')
	);

	const offlineRudders = computed(() =>
		rudders.value.filter((r: Rudder) => r.status === 'offline')
	);

	const getRudders = async () => {
		loading.value = true;
		error.value = null;
		try {
			const response = await apiGet<Rudder[]>(API_ENDPOINTS.RUDDERS.LIST);
			rudders.value = response;
		} catch (err) {
			error.value = (err as Error).message;
		} finally {
			loading.value = false;
		}
	};

	const updateRudderStatus = (rudderId: string, status: 'online' | 'offline') => {
		const rudder = rudders.value.find((r: Rudder) => r.id === rudderId);
		if (rudder) {
			rudder.status = status;
			rudder.lastHeartbeat = new Date().toISOString();
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
