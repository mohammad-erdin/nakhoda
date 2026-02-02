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
      <template v-else-if="column.key === 'actions'">
        <a-button-group class="inline-flex items-center gap-2 p-1 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)]" size="small">
          <a-popconfirm title="Start this container?" okText="Start" @confirm="doAction('start', record.id, record.rudderId)">
            <a-button type="text" title="Start" class="px-2 py-1 text-[var(--color-muted)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--color-text)]"><i class="ri-play-fill" /></a-button>
          </a-popconfirm>

          <a-popconfirm title="Stop this container?" okText="Stop" @confirm="doAction('stop', record.id, record.rudderId)">
            <a-button type="text" title="Stop" class="px-2 py-1 text-[var(--color-muted)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--color-text)]"><i class="ri-stop-fill" /></a-button>
          </a-popconfirm>

          <a-popconfirm title="Destroy this container?" okText="Destroy" @confirm="doAction('destroy', record.id, record.rudderId)">
            <a-button type="text" danger class="text-[var(--color-danger)] px-2 py-1" title="Destroy"><i class="ri-delete-bin-line" /></a-button>
          </a-popconfirm>
        </a-button-group>
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

const emit = defineEmits<{
  selectionChange: [keys: string[], rows: Container[]];
  action: [{ action: 'start' | 'stop' | 'destroy'; id: string; rudderId?: string }];
}>();

const props = defineProps<Props>();

const columns = [
  { title: 'Server', dataIndex: 'rudderId', key: 'rudderId' , width: 160},
  { title: 'Name', dataIndex: 'name', key: 'name' , width: 250},
  { title: 'Image', dataIndex: 'image', key: 'image' , width: 250},
  { title: 'Status', dataIndex: 'status', key: 'status' , width: 200, align: 'center'},
  { title: 'Actions', key: 'actions' , width: 200, align: 'center'},
  { title: '' },
];

const rowSelection = computed(() => ({
  selectedRowKeys: props.selectedKeys || [],
  onChange: (keys: string[], rows: Container[]) => emit('selectionChange', keys, rows),
}));

const doAction = (action: 'start' | 'stop' | 'destroy', id: string, rudderId?: string) => {
  emit('action', { action, id, rudderId });
};
</script>
