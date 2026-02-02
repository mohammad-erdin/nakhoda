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
        <a-button-group class="action-group" size="small">
          <a-popconfirm title="Start this container?" okText="Start" @confirm="doAction('start', record.id, record.rudderId)">
            <a-button type="text" title="Start"><i class="ri-play-fill" /></a-button>
          </a-popconfirm>

          <a-popconfirm title="Stop this container?" okText="Stop" @confirm="doAction('stop', record.id, record.rudderId)">
            <a-button type="text" title="Stop"><i class="ri-stop-fill" /></a-button>
          </a-popconfirm>

          <a-popconfirm title="Destroy this container?" okText="Destroy" @confirm="doAction('destroy', record.id, record.rudderId)">
            <a-button type="text" danger class="destroy-btn" title="Destroy"><i class="ri-delete-bin-line" /></a-button>
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

<style scoped>
.action-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: var(--color-surface-alt, #f1f5f9);
  border: 1px solid rgba(0,0,0,0.06);
}

.action-group .ant-btn {
  border: none !important;
  background: transparent !important;
  padding: 6px 10px !important;
  min-width: 36px;
  height: 32px;
  color: var(--color-muted, #6b6b6b) !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* subtle hover */
.action-group .ant-btn:hover {
  background: rgba(0,0,0,0.04) !important;
  color: var(--color-text) !important;
}

/* subtle selected look that works in dark/light */
.action-group .ant-btn:first-child {
  background: rgba(255,255,255,0.02) !important;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.06);
  color: var(--color-text) !important;
  border-radius: 6px;
}

.action-group .destroy-btn {
  color: var(--color-danger, #d9534f) !important;
}

.action-group .ant-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}
</style>
