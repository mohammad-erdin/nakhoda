import {
	createRouter,
	createWebHistory,
	type RouteRecordRaw,
	type RouteLocationNormalized,
	type NavigationGuardNext,
} from 'vue-router';
import { useAuth } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
	{
		path: '/login',
		name: 'Login',
		component: () => import('@/pages/Login.vue'),
		meta: { requiresAuth: false },
	},
	{
		path: '/',
		name: 'Dashboard',
		component: () => import('@/pages/Dashboard.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/rudders',
		name: 'RudderList',
		component: () => import('@/pages/RudderList.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/rudders/:id',
		name: 'RudderDetail',
		component: () => import('@/pages/RudderDetail.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/containers',
		name: 'ContainerList',
		component: () => import('@/pages/ContainerList.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/containers/create',
		name: 'ContainerCreate',
		component: () => import('@/pages/ContainerCreate.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/containers/:id',
		name: 'ContainerDetail',
		component: () => import('@/pages/ContainerDetail.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/images',
		name: 'ImageList',
		component: () => import('@/pages/ImageList.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/volumes',
		name: 'VolumeList',
		component: () => import('@/pages/VolumeList.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/jobs',
		name: 'JobHistory',
		component: () => import('@/pages/JobHistory.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/jobs/:id',
		name: 'JobDetail',
		component: () => import('@/pages/JobDetail.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/settings',
		name: 'Settings',
		component: () => import('@/pages/Settings.vue'),
		meta: { requiresAuth: true },
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: () => import('@/pages/NotFound.vue'),
		meta: { requiresAuth: false },
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
	const auth = useAuth();
	const requiresAuth = to.meta.requiresAuth !== false;

	// Ensure we have validated the token before deciding route transitions
	if (!auth.checked) {
		await auth.checkAuth();
	}

	if (requiresAuth && !auth.isAuthenticated) {
		return next({ name: 'Login', query: { redirect: to.fullPath } });
	}

	if (to.name === 'Login' && auth.isAuthenticated) {
		return next({ name: 'Dashboard' });
	}

	next();
});

export default router;
