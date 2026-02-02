import { ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type { Ref } from 'vue';

export const APP_BREAKPOINT = '(max-width: 768px)';

export function isMobile(): Ref<boolean> {
	return useMediaQuery(APP_BREAKPOINT);
}

export function isDarkTheme(): Ref<boolean> {
	const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = ref<boolean>(false);

	try {
		const raw = typeof window !== 'undefined' && localStorage ? localStorage.getItem('settings') : null;
		if (raw) {
			const parsed = JSON.parse(raw);
			const t = parsed?.setting?.theme;
			if (t === 'dark') {
				theme.value = true;
				return theme;
			}
			if (t === 'light') {
				theme.value = false;
				return theme;
			}
		}
	} catch { }

	theme.value = prefersDark.value;
	try {
		localStorage.setItem('settings', JSON.stringify({ setting: { theme: theme.value ? 'dark' : 'light' } }));
	} catch { }

	watch(prefersDark, (val) => {
		theme.value = val;
		try {
			localStorage.setItem('settings', JSON.stringify({ setting: { theme: val ? 'dark' : 'light' } }));
		} catch { }
	});

	return theme;
}
