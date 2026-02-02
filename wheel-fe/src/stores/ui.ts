import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUI = defineStore('ui', () => {
	const sidebarCollapsed = ref(false);
	const theme = ref<'dark' | 'light'>('dark');

	const toggleSidebar = () => {
		sidebarCollapsed.value = !sidebarCollapsed.value;
	};

	const setTheme = (newTheme: 'dark' | 'light') => {
		theme.value = newTheme;
	};

	return { sidebarCollapsed, theme, toggleSidebar, setTheme };
});
