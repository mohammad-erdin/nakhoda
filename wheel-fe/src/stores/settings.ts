import { defineStore } from 'pinia';

export const useSettings = defineStore('settings', () => {
	const ls = localStorage;
	const configDir: Record<string, any> = JSON.parse(ls.getItem('settings') || '{}') as Record<string, any>;

	function setSetting(key: string, value: any) {
		configDir[key] = value;
		localStorage.setItem('settings', JSON.stringify(configDir));
	}

	function getSetting(key: string): any {
		return configDir[key] ?? null;
	}

	return {
		setSetting,
		getSetting,
		configDir,
	};
});