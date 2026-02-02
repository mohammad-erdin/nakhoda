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

  // Load settings from localStorage if present
  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('settings');
      if (raw) {
        settings.value = JSON.parse(raw) as Settings;
        // apply theme immediately
        try {
          const ui = useUI();
          if (settings.value?.theme) ui.setTheme(settings.value.theme);
        } catch (e) {
          // ignore
        }
        return true;
      }
    } catch (e) {
      // ignore parse errors
    }
    return false;
  }

  async function loadFromApi() {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiGet<Settings>(API_ENDPOINTS.SETTINGS.GET);
      settings.value = data;
      // apply theme
      try {
        const ui = useUI();
        if (data?.theme) ui.setTheme(data.theme);
      } catch (e) {}
      try {
        localStorage.setItem('settings', JSON.stringify(data || {}));
      } catch (e) {
        // ignore
      }
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
      // apply theme
      try {
        const ui = useUI();
        if (data?.theme) ui.setTheme(data.theme);
      } catch (e) {}
      // apply theme
      try {
        const ui = useUI();
        if (data?.theme) ui.setTheme(data.theme);
      } catch (e) {}
      try {
        localStorage.setItem('settings', JSON.stringify(data || {}));
      } catch (e) {}
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
        try {
          await loadFromApi();
        } catch (e) {
          // ignore
        }
      }
    },
    { immediate: true }
  );

  // Also load when user logs in
  watch(
    () => auth.isAuthenticated,
    async (isAuth) => {
      if (isAuth && !settings.value) {
        try {
          await loadFromApi();
        } catch (e) {}
      }
      if (!isAuth) {
        settings.value = null;
        try {
          localStorage.removeItem('settings');
        } catch (e) {}
      }
    }
  );

  return { settings, loading, error, loadFromApi, loadFromLocalStorage, saveToApi };
});