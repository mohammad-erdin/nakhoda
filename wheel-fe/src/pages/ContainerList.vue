<template>
	<div class="page px-6 py-6">
		<div class="flex flex--between items-center">
			<div class="page__title text-2xl font-semibold mb-0">
				Containers
			</div>
			<a-button
				type="primary"
				@click="$router.push('/containers/create')"
			>
				Create
			</a-button>
		</div>

		<a-card class="filters-card">
			<a-form
				layout="inline"
				class="filters-form w-full"
			>
				<a-form-item label="Server">
					<a-select
						v-model:value="filters.rudder"
						placeholder="Server"
						allow-clear
						@change="onRudderChange"
						style="width: 200px"
					>
						<a-select-option
							v-for="r in rudders.rudders"
							:key="r.id"
							:value="r.id"
						>
							{{ r.hostname || r.id }}
						</a-select-option>
					</a-select>
				</a-form-item>

				<a-form-item label="Status">
					<a-select
						v-model:value="filters.status"
						placeholder="Status"
						allow-clear
						@change="applyFilters"
						style="width: 140px"
					>
						<a-select-option value="">
							All status
						</a-select-option>
						<a-select-option value="running">
							Running
						</a-select-option>
						<a-select-option value="stopped">
							Stopped
						</a-select-option>
						<a-select-option value="exited">
							Exited
						</a-select-option>
					</a-select>
				</a-form-item>

				<a-form-item class="ml-auto">
					<a-input
						v-model:value="filters.searchText"
						placeholder="Search..."
						style="width: 200px"
						@input="applyFilters"
					/>
				</a-form-item>

				<a-form-item>
					<a-button-group
						class="inline-flex items-center gap-2 p-1 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
						size="small"
					>
						<a-popover
							placement="top"
							trigger="hover"
						>
							<template #content>
								Type <strong>Start</strong> to confirm starting selected containers.
							</template>
							<a-button
								type="default"
								:disabled="!hasSelection"
								@click="confirmStart"
								title="Start"
							>
								<i class="ri-play-fill" />
							</a-button>
						</a-popover>

						<a-popover
							placement="top"
							trigger="hover"
						>
							<template #content>
								Type <strong>Stop</strong> to confirm stopping selected containers.
							</template>
							<a-button
								type="default"
								:disabled="!hasSelection"
								@click="confirmStop"
								title="Stop"
							>
								<i class="ri-stop-fill" />
							</a-button>
						</a-popover>

						<a-popover
							placement="top"
							trigger="hover"
						>
							<template #content>
								Type <strong>Destroy</strong> to permanently delete selected containers.
							</template>
							<a-button
								type="default"
								danger
								class="text-[var(--color-danger)] destroy-btn"
								:disabled="!hasSelection"
								@click="confirmDestroy"
								title="Destroy"
							>
								<i class="ri-delete-bin-line" />
							</a-button>
						</a-popover>
					</a-button-group>
				</a-form-item>
			</a-form>
		</a-card> 

		<a-alert
			v-if="containers.error"
			:message="auth.isAuthenticated ? containers.error : 'Not authenticated — please log in to view containers'"
			type="warning"
			show-icon
			style="margin-bottom: 12px;"
		/>
		<ContainerTable
			:containers="containers.paginatedContainers"
			:loading="containers.loading"
			:selected-keys="selectedKeys"
			@selection-change="onSelectionChange"
			@action="handleRowAction"
		/>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useContainers } from '@/stores/containers';
import { useRudders } from '@/stores/rudders';
import { useAuth } from '@/stores/auth';
import ContainerTable from '@/components/ContainerTable.vue';
import { apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';
import { confirmWithInput } from '@/utils/confirmPrompt';

const containers = useContainers();
const rudders = useRudders();
const auth = useAuth();

const filters = reactive({
	status: '',
	rudder: '',
	searchText: ''
});

const selectedKeys = ref<string[]>([]);
const selectedRows = ref<any[]>([]);

const hasSelection = computed(() => selectedKeys.value.length > 0);

const applyFilters = () => {
	containers.setFilters(filters);
};

const onRudderChange = (value: string) => {
	filters.rudder = value;
	rudders.setSelectedRudder(value || null);
	applyFilters();
};

const onSelectionChange = (keys: string[], rows: any[]) => {
	selectedKeys.value = keys;
	selectedRows.value = rows;
};

const handleRowAction = async ({ action, id, rudderId }: { action: string; id: string; rudderId?: string }) => {
	const targetRudder = rudderId || filters.rudder || rudders.selectedRudder?.id || '';
	const cfg: Record<string, any> = {
		start: {
			title: 'Confirm Start',
			expected: 'Start',
			okText: 'Start',
			fn: async () => {
				if (typeof containers.startSelected === 'function') {
					await containers.startSelected(targetRudder, [id]);
				} else {
					await apiPost(API_ENDPOINTS.CONTAINERS.START(id), { rudder_id: targetRudder });
				}
			},
		},
		stop: {
			title: 'Confirm Stop',
			expected: 'Stop',
			okText: 'Stop',
			fn: async () => {
				await containers.stopSelected(targetRudder, [id]);
			},
		},
		destroy: {
			title: 'Confirm Destroy',
			expected: 'Destroy',
			okText: 'Destroy',
			fn: async () => {
				await containers.destroySelected(targetRudder, [id]);
			},
		},
	};

	const conf = cfg[action];
	if (!conf) return;

	const ok = await confirmWithInput({
		title: conf.title,
		content: `Type "${conf.expected}" to confirm ${conf.title.toLowerCase()}`,
		expected: conf.expected,
		okText: conf.okText,
		cancelText: 'Cancel',
	});
	if (!ok) return;

	try {
		await conf.fn();
		containers.getContainers();
		message.success(`${conf.okText} job submitted`);
	} catch (err) {
		message.error((err as Error).message || `Failed to ${action}`);
	}
};

const confirmStop = async () => {
	if (!hasSelection.value) return;
	const ok = await confirmWithInput({
		title: 'Confirm Stop',
		content: 'Type "Stop" to confirm stopping selected containers',
		expected: 'Stop',
		okText: 'Stop',
		cancelText: 'Cancel',
	});
	if (!ok) return;
	try {
		await containers.stopSelected(filters.rudder || rudders.selectedRudder?.id || '', selectedKeys.value);
		selectedKeys.value = [];
		containers.getContainers();
		message.success('Stop jobs submitted');
	} catch (err) {
		message.error((err as Error).message || 'Failed to stop containers');
	}
};

const confirmStart = async () => {
	if (!hasSelection.value) return;
	const ok = await confirmWithInput({
		title: 'Confirm Start',
		content: 'Type "Start" to confirm starting selected containers',
		expected: 'Start',
		okText: 'Start',
		cancelText: 'Cancel',
	});
	if (!ok) return;
	try {
		if (typeof containers.startSelected === 'function') {
			await containers.startSelected(filters.rudder || rudders.selectedRudder?.id || '', selectedKeys.value);
		} else {
			// Fallback: call API directly for each id
			for (const id of selectedKeys.value) {
				await apiPost(API_ENDPOINTS.CONTAINERS.START(id), { rudder_id: filters.rudder || rudders.selectedRudder?.id || '' });
			}
		}

		selectedKeys.value = [];
		containers.getContainers();
		message.success('Start jobs submitted');
	} catch (err) {
		console.warn('startSelected fallback error', err);
		message.error((err as Error).message || 'Failed to start containers');
	}
};

const confirmDestroy = async () => {
	if (!hasSelection.value) return;
	const ok = await confirmWithInput({
		title: 'Confirm Destroy',
		content: 'Type "Destroy" to confirm destroying selected containers',
		expected: 'Destroy',
		okText: 'Destroy',
		cancelText: 'Cancel',
	});
	if (!ok) return;
	try {
		await containers.destroySelected(filters.rudder || rudders.selectedRudder?.id || '', selectedKeys.value);
		selectedKeys.value = [];
		containers.getContainers();
		message.success('Destroy jobs submitted');
	} catch (err) {
		message.error((err as Error).message || 'Failed to destroy containers');
	}
};

onMounted(() => {
	containers.getContainers();
	rudders.getRudders();
});

// Re-fetch containers when auth status changes (e.g., after login)
watch(
	() => auth.isAuthenticated,
	(isAuth) => {
		if (isAuth) {
			containers.getContainers();
		}
	}
);

// Ensure first rudder is selected once rudders load (run immediately in case rudders are already loaded)
watch(
	() => rudders.rudders.length,
	(len) => {
		if (len > 0 && !filters.rudder) {
			// prefer first online rudder, otherwise fall back to first in list
			const preferred = rudders.onlineRudders.length ? rudders.onlineRudders[0] : rudders.rudders[0];
			filters.rudder = preferred.id;
			rudders.setSelectedRudder(preferred.id);
			applyFilters();
		}
	},
	{ immediate: true }
);
</script>
