import { ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useSettings } from '@/stores/settings';

const isDark = ref<boolean>(true);
const isMobile = ref<boolean>(false);

export function useDisplay() {
	const APP_BREAKPOINT = '(max-width: 768px)';
	const st = useSettings();
	const theme = st.getSetting('theme');
	
	// isDark initial value
	isDark.value = theme === 'dark' || (theme === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

	// apply initial document class so Tailwind's class-based dark variant works in CSS
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', isDark.value);
	}

	// isMobile initial value
	const mq = useMediaQuery(APP_BREAKPOINT);
	watch(mq, (v) => { isMobile.value = v; }, { immediate: true });
	
	function toggleTheme() {
		isDark.value = !isDark.value;
		st.setSetting('theme', isDark.value ? 'dark' : 'light');
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', isDark.value);
		}
	}

	return {
		isDark,
		isMobile,
		toggleTheme,
	};
}