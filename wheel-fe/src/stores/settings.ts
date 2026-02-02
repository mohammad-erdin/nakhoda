import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { apiGet, apiPatch } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';
import { useAuth } from './auth';
import { useUI } from './ui';

export type Settings = {
	jobRetentionDays: number;
	theme: 'light' | 'dark';
	language: string;
};

export const useSettings = defineStore('settings', () => {
	const settings = ref<Settings | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);

	// Helpers to centralize storage access and theme application
	function settingGet<T>(key: string): T | null {
		const raw = localStorage.getItem(key) ?? null;
		return raw ? (JSON.parse(raw) as T) : null;
	}

	function settingSet(key: string, value: unknown) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	function settingRemove(key: string) {
		localStorage.removeItem(key);
	}

	function applyTheme(themeName?: 'light' | 'dark' | null) {
		try {
			const ui = useUI();
			if (themeName) ui.setTheme(themeName);
		} catch (_e) {
		}
	}

	// Load settings from localStorage if present
	function loadFromLocalStorage() {
		const parsed = settingGet<Settings>('settings');
		if (parsed) {
			settings.value = parsed;
			applyTheme(parsed.theme);
			return true;
		}
		return false;
	}

	async function loadFromApi() {
		loading.value = true;
		error.value = null;
		try {
			const data = await apiGet<Settings>(API_ENDPOINTS.SETTINGS.GET);
			settings.value = data;
			applyTheme(data?.theme);
			settingSet('settings', data || {});
			return data;
		} catch (err) {
			error.value = (err as Error).message;
			throw err;
		} finally {
			loading.value = false;
		}
	}

	async function saveToApi(partial: Partial<Settings>) {
		loading.value = true;
		error.value = null;
		try {
			const data = await apiPatch<Settings>(API_ENDPOINTS.SETTINGS.UPDATE, partial);
			settings.value = data;
			applyTheme(data?.theme);
			settingSet('settings', data || {});
			return data;
		} catch (err) {
			error.value = (err as Error).message;
			throw err;
		} finally {
			loading.value = false;
		}
	}

	// Initialize: read from localStorage; if missing and authenticated, fetch from API
	const auth = useAuth();
	const loadedFromLocal = loadFromLocalStorage();

	watch(
		() => auth.checked,
		async (checked) => {
			if (!loadedFromLocal && checked && auth.isAuthenticated) {
				await loadFromApi();
			}
		},
		{ immediate: true }
	);

	// Also load when user logs in
	watch(
		() => auth.isAuthenticated,
		async (isAuth) => {
			if (isAuth && !settings.value) {
				await loadFromApi();
				if (!isAuth) {
					settings.value = null;
					settingRemove('settings');
				}
			}
		}
	);

	return { settings, loading, error, loadFromApi, loadFromLocalStorage, saveToApi };
});