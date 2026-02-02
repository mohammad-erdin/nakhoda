<template>
	<AConfigProvider>
		<component :is="activeLayout" />
	</AConfigProvider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue';
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';
import { APP_LAYOUT } from './constans/layouts';

const AppLayoutEmpty = defineAsyncComponent(() =>
	import('./components/BlankLayout.vue')
);

const route: RouteLocationNormalizedLoaded = useRoute();
const activeLayout = computed<Component>(() => {
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
</script>