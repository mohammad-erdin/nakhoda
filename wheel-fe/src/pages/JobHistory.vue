<template>
  <div class="page">
    <div class="page__title">Job History</div>
    
    <!-- Filters -->
    <a-card class="filters-card">
      <a-form layout="inline" class="filters-form">
        <a-form-item label="Status">
          <a-select
            v-model:value="filters.status"
            style="width: 150px"
            placeholder="All statuses"
            allowClear
          >
            <a-select-option value="pending">Pending</a-select-option>
            <a-select-option value="running">Running</a-select-option>
            <a-select-option value="done">Done</a-select-option>
            <a-select-option value="failed">Failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Server">
          <a-select
            v-model:value="filters.serverId"
            style="width: 220px"
            placeholder="Server"
            :loading="servers.loading"
            allowClear
          >
            <a-select-option
              v-for="r in servers.rudders"
              :key="r.id"
              :value="r.id"
            >{{ r.hostname || r.id }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Date Range">
          <a-range-picker
            v-model:value="filters.range"
            style="width: 260px"
            :allow-empty="[false, false]"
            value-format="YYYY-MM-DD"
            :disabled-date="disableFutureDates"
            format="YYYY-MM-DD"
          />
        </a-form-item>
      </a-form>
    </a-card>

    <!-- Jobs Table -->
    <a-table
      :columns="columns"
      :data-source="jobs.items"
      :loading="jobs.loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
      class="jobs-table"
      :row-class-name="() => 'clickable-row'"
      @row-click="handleRowClick"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'id'">
          <span class="job-id">{{record.id }}</span>
        </template>
        <template v-if="column.key === 'status'">
          <StatusTag :status="record.status" />
        </template>
        <template v-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-if="column.key === 'completedAt'">
          {{ record.completedAt ? formatDate(record.completedAt) : '-' }}
        </template>
        <template v-if="column.key === 'duration'">
          {{ formatDuration(record.startedAt, record.completedAt) }}
        </template>
        <template v-if="column.key === 'rudderId'">
          <span class="rudder-id">{{ record.rudderId }}</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useJobs } from '@/stores/jobs';
import { useRudders } from '@/stores/rudders';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate, formatDuration } from '@/utils/format';
import { apiGet } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

const router = useRouter();
const jobsStore = useJobs();

// default date range: yesterday - today
const _yesterday = new Date();
_yesterday.setDate(_yesterday.getDate() - 1);
const _today = new Date();

const filters = reactive({
  status: undefined as string | undefined,
  serverId: undefined as string | undefined,
  range: [
    _yesterday.toISOString().slice(0, 10),
    _today.toISOString().slice(0, 10),
  ] as string[],
});

const currentPage = ref(1);
const pageSize = ref(50);

const jobs = reactive({
  items: [] as any[],
  loading: false,
  total: 0,
});

const columns = [
  { title: 'Job ID', dataIndex: 'id', key: 'id', width: 350 },
  { title: 'Action', dataIndex: 'action', key: 'action', width: 200 },
  { title: 'Server', dataIndex: 'rudderId', key: 'rudderId', width: 200 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 200 },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 200 },
  { title: 'Completed', dataIndex: 'completedAt', key: 'completedAt', width: 200 },
  { title: 'Duration', key: 'duration', width: 120 },
  { title: '' },
];

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: jobs.total,
  showSizeChanger: true,
  showTotal: (total: number) => `Total ${total} jobs`,
}));

const servers = useRudders();

const disableFutureDates = (current: any) => {
  // Disable dates in the future
  try {
    return new Date(current) > new Date();
  } catch (e) {
    return false;
  }
};

const loadJobs = async () => {
  jobs.loading = true;
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    // keep backend param name for compatibility
    if (filters.serverId) params.append('rudder_id', filters.serverId);
    if (filters.range && filters.range.length === 2) {
      params.append('from', filters.range[0]);
      params.append('to', filters.range[1]);
    }
    params.append('page', currentPage.value.toString());
    params.append('limit', pageSize.value.toString());

    const data = await apiGet<any>(`${API_ENDPOINTS.JOBS.LIST}?${params.toString()}`);
    jobs.items = data?.items || [];
    jobs.total = data?.total || 0;
  } catch (err) {
    console.error('Error loading jobs:', err);
    jobs.items = [];
    jobs.total = 0;
  } finally {
    jobs.loading = false;
  }
};


// watch filters and trigger reload in realtime (reset to first page)
watch(
  () => [filters.status, filters.serverId, filters.range],
  async () => {
    currentPage.value = 1;
    await loadJobs();
  },
  { immediate: true }
);

// sync selected rudder in store when server changes
watch(
  () => filters.serverId,
  (val) => {
    servers.setSelectedRudder(val || null);
  }
);

const handleTableChange = (pag: any) => {
  currentPage.value = pag.current;
  pageSize.value = pag.pageSize;
  loadJobs();
};

const handleRowClick = (record: any) => {
  router.push(`/jobs/${record.id}`);
};


onMounted(async () => {
  await servers.getRudders();
  if (servers.rudders.length && !filters.serverId) {
    // prefer an online server if available
    const preferred = servers.onlineRudders.length ? servers.onlineRudders[0] : servers.rudders[0];
    filters.serverId = preferred.id;
    servers.setSelectedRudder(filters.serverId);
  }
  // loadJobs will be triggered by the watch above (immediate)
});
</script>

<style scoped lang="scss">
@import '@/styles/mixins';
@import '@/styles/variables';

.filters-card {
  margin-bottom: $spacing-md;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);

  .ant-form-item-label label {
    color: var(--color-muted);
  }
}

.filters-form {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

// Deep selectors for Ant Design components
:deep(.filters-card) {
  .ant-select .ant-select-selector,
  .ant-input,
  .ant-input-number-input {
    @include input-base;
  }
}

.jobs-table {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

:deep(.ant-table-thead > tr > th) {
  background: var(--color-surface-alt) !important;
  color: var(--color-muted) !important;
  border-bottom: 1px solid var(--color-border) !important;
}

:deep(.clickable-row) {
  cursor: pointer;
  transition: background-color $transition-base;

  &:hover {
    background-color: rgba(255, 255, 255, 0.03) !important;
  }
}

.job-id,
.rudder-id {
  font-family: monospace;
  font-size: 13px;
}
</style>

