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
            @change="handleFilterChange"
          >
            <a-select-option value="pending">Pending</a-select-option>
            <a-select-option value="running">Running</a-select-option>
            <a-select-option value="done">Done</a-select-option>
            <a-select-option value="failed">Failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Rudder">
          <a-input
            v-model:value="filters.rudderId"
            style="width: 200px"
            placeholder="Rudder ID"
            allowClear
            @change="handleFilterChange"
          />
        </a-form-item>
        <a-form-item label="Days">
          <a-input-number
            v-model:value="filters.days"
            :min="1"
            :max="90"
            style="width: 100px"
            placeholder="7"
            @change="handleFilterChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="applyFilters">
            <i class="ri-search-line"></i> Search
          </a-button>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetFilters">
            <i class="ri-refresh-line"></i> Reset
          </a-button>
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
          <span class="job-id">{{ record.id.substring(0, 8) }}...</span>
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useJobs } from '@/stores/jobs';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate, formatDuration } from '@/utils/format';

const router = useRouter();
const jobsStore = useJobs();

const filters = reactive({
  status: undefined as string | undefined,
  rudderId: undefined as string | undefined,
  days: undefined as number | undefined,
});

const currentPage = ref(1);
const pageSize = ref(50);

const jobs = reactive({
  items: [] as any[],
  loading: false,
  total: 0,
});

const columns = [
  { title: 'Job ID', dataIndex: 'id', key: 'id', width: 120 },
  { title: 'Action', dataIndex: 'action', key: 'action', width: 200 },
  { title: 'Rudder', dataIndex: 'rudderId', key: 'rudderId', width: 150 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: 'Completed', dataIndex: 'completedAt', key: 'completedAt', width: 180 },
  { title: 'Duration', key: 'duration', width: 120 },
];

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: jobs.total,
  showSizeChanger: true,
  showTotal: (total: number) => `Total ${total} jobs`,
}));

const handleFilterChange = () => {
  // Auto-apply filters on change if needed
};

const applyFilters = async () => {
  currentPage.value = 1;
  await loadJobs();
};

const resetFilters = async () => {
  filters.status = undefined;
  filters.rudderId = undefined;
  filters.days = undefined;
  currentPage.value = 1;
  await loadJobs();
};

const handleTableChange = (pag: any) => {
  currentPage.value = pag.current;
  pageSize.value = pag.pageSize;
  loadJobs();
};

const handleRowClick = (record: any) => {
  router.push(`/jobs/${record.id}`);
};

const loadJobs = async () => {
  jobs.loading = true;
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.rudderId) params.append('rudder_id', filters.rudderId);
    if (filters.days) params.append('days', filters.days.toString());
    params.append('page', currentPage.value.toString());
    params.append('limit', pageSize.value.toString());

    const response = await fetch(`/api/jobs?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch jobs');

    const data = await response.json();
    jobs.items = data.items || [];
    jobs.total = data.total || 0;
  } catch (err) {
    console.error('Error loading jobs:', err);
  } finally {
    jobs.loading = false;
  }
};

onMounted(() => {
  loadJobs();
});
</script>

<style scoped>
.filters-card {
  margin-bottom: 16px;
}

.filters-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.jobs-table {
  background: white;
}

:deep(.clickable-row) {
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.clickable-row:hover) {
  background-color: #f5f5f5 !important;
}

.job-id,
.rudder-id {
  font-family: monospace;
  font-size: 13px;
}
</style>

