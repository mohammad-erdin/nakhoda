<template>
	<AConfigProvider :theme="themeConfig">
		<component :is="activeLayout" />
	</AConfigProvider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';
import { APP_LAYOUT } from './constans/layouts';
import { theme } from 'ant-design-vue';
import { useDisplay } from './composables/useDisplay';

// routing
const route: RouteLocationNormalizedLoaded = useRoute();
const AppLayoutEmpty = defineAsyncComponent(() =>
	import('./components/BlankLayout.vue')
);
const activeLayout = computed(() => {
	const routeLayout = route.meta?.layout as APP_LAYOUT | undefined;
	switch (routeLayout) {
		case APP_LAYOUT.ADMIN:
			return defineAsyncComponent(() =>
				import('./components/AppLayout.vue')
			);
		default:
			return AppLayoutEmpty;
	}
});

// theme config
const {  isDark } = useDisplay();
const themeConfig = computed(() => ({
	algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
	token: { colorPrimary: '#1890ff' }
}));

</script>