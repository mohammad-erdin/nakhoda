<template>
  <div class="page">
    <div class="page__title">Job History</div>
    <a-table :columns="columns" :data-source="jobs.jobs" :loading="jobs.loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <StatusTag :status="record.status" />
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useJobs } from '@/stores/jobs';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate, formatDuration } from '@/utils/format';

const jobs = useJobs();

const columns = [
  { title: 'Job ID', dataIndex: 'id', key: 'id' },
  { title: 'Action', dataIndex: 'action', key: 'action' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', customRender: ({ text }: any) => formatDate(text) },
  { title: 'Completed', dataIndex: 'completedAt', key: 'completedAt', customRender: ({ text }: any) => formatDate(text) },
  { title: 'Duration', key: 'duration', customRender: ({ record }: any) => formatDuration(record.startedAt, record.completedAt) },
];

onMounted(() => {
  jobs.getJobs();
});
</script>
