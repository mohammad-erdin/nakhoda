<template>
  <a-table
    :columns="columns"
    :data-source="containers"
    :loading="loading"
    row-key="id"
    :row-selection="rowSelection"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <StatusTag :status="record.status" />
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import type { Container } from '@nakhoda/shared/types';
import { computed } from 'vue';
import StatusTag from '@/components/StatusTag.vue';

interface Props {
  containers: Container[];
  loading: boolean;
  selectedKeys?: string[];
}

const emit = defineEmits<{ selectionChange: [keys: string[], rows: Container[]] }>();

const props = defineProps<Props>();

const columns = [
  { title: 'Rudder', dataIndex: 'rudderId', key: 'rudderId' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Image', dataIndex: 'image', key: 'image' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
];

const rowSelection = computed(() => ({
  selectedRowKeys: props.selectedKeys || [],
  onChange: (keys: string[], rows: Container[]) => emit('selectionChange', keys, rows),
}));
</script>
