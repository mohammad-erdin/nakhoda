import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiPost } from '@/utils/apiClient';
import type { LoginResponse } from '@nakhoda/shared/types';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

interface AuthUser {
	id: string;
	name: string;
}

export const useAuth = defineStore('auth', () => {
	const token = ref<string | null>(localStorage.getItem('auth_token'));
	const user = ref<AuthUser | null>(null);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const isAuthenticated = computed(() => !!token.value);
	const checked = ref(false);

	let checkAuthPromise: Promise<boolean> | null = null;

	const login = async (username: string, password: string) => {
		isLoading.value = true;
		error.value = null;
		try {
			const data = await apiPost<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
				username,
				password
			});
			token.value = data.sessionToken || 'auth-token';
			user.value = data.user;
			localStorage.setItem('auth_token', token.value);
			await checkAuth();
		} catch (err) {
			error.value = (err as Error).message;
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	const logout = () => {
		token.value = null;
		user.value = null;
		checked.value = true;
		localStorage.removeItem('auth_token');
		try {
			localStorage.removeItem('settings');
		} catch (_e) { }
	};

	const checkAuth = async () => {
		// Dedupe concurrent calls
		if (checkAuthPromise) return checkAuthPromise;

		checkAuthPromise = (async () => {
			// If no token, mark as checked and return
			if (!token.value) {
				checked.value = true;
				checkAuthPromise = null;
				return false;
			}

			try {
				checked.value = true;
				checkAuthPromise = null;
				return true;
			} catch (_err) {
				logout();
				checked.value = true;
				checkAuthPromise = null;
				return false;
			}
		})();

		return checkAuthPromise;
	};

	return { token, user, isAuthenticated, checked, isLoading, error, login, logout, checkAuth };
});
