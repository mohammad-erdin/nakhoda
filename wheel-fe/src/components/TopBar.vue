<template>
	<a-layout-header class="h-16 px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a-button
				type="text"
				@click="ui.toggleSidebar"
			>
				<i class="ri-menu-line text-lg" />
			</a-button>
			<span class="font-semibold text-[var(--color-text)]">Wheel Control</span>
		</div>

		<div class="flex items-center gap-4">
			<a-button
				type="text"
				class="group text-[var(--color-text)] text-lg transition-colors duration-300"
				@click="toggleTheme"
				:title="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} theme`"
			>
				<i :class="[ui.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line', 'transform transition-transform duration-300 group-hover:rotate-180 text-xl']" />
			</a-button>
			<span class="text-[var(--color-muted)]">{{ auth.user?.name || 'Operator' }}</span>
			<a-button
				type="primary"
				danger
				@click="handleLogout"
			>
				Logout
			</a-button>
		</div>
	</a-layout-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';
import { useUI } from '@/stores/ui';
import { useSettings } from '@/stores/settings';

const router = useRouter();
const auth = useAuth();
const ui = useUI();
const settings = useSettings();

const toggleTheme = async () => {
	const newTheme = ui.theme === 'dark' ? 'light' : 'dark';

	// apply immediately for instant UX
	ui.setTheme(newTheme);

	// persist to localStorage (merge with existing settings if present)
	try {
		const raw = localStorage.getItem('settings');
		const parsed = raw ? JSON.parse(raw) : {};
		parsed.theme = newTheme;
		localStorage.setItem('settings', JSON.stringify(parsed));
	} catch (_e) {
		// ignore localStorage errors
		// console.warn('Failed to update local settings', e);
	}

	// if authenticated, persist to server; otherwise keep local only
	if (auth.isAuthenticated) {
		try {
			await settings.saveToApi({ theme: newTheme });
		} catch (_e) {
			// don't block the UI; optionally log
			// console.warn('Failed to save theme to server', e);
		}
	} else {
		// update in-memory settings store so other parts of app see the change
		try {
			settings.settings = { ...(settings.settings || {}), theme: newTheme } as any;
		} catch (_e) {}
	}
};

const handleLogout = () => {
	auth.logout();
	router.push({ name: 'Login' });
};
</script> 
