<template>
  <a-table
    :columns="columns"
    :data-source="rudders"
    :loading="loading"
    row-key="id"
    :customRow="customRow"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <StatusTag :status="record.status" />
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import type { Rudder } from '@nakhoda/shared/types';
import { formatDate } from '@/utils/format';
import StatusTag from '@/components/StatusTag.vue';
import { useRouter } from 'vue-router';

interface Props {
  rudders: Rudder[];
  loading: boolean;
}

const props = defineProps<Props>();
const router = useRouter();

const columns = [
  { title: 'Hostname', dataIndex: 'hostname', key: 'hostname' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Docker', dataIndex: 'dockerVersion', key: 'dockerVersion' },
  { title: 'Last Heartbeat', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', customRender: ({ text }: any) => formatDate(text) },
];

const handleRowClick = (record: Rudder) => {
  router.push(`/rudders/${record.id}`);
};

const customRow = (record: Rudder) => {
  return {
    onClick: () => handleRowClick(record),
  };
};
</script>
