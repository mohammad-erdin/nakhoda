<template>
  <a-table :columns="columns" :data-source="containers" :loading="loading" row-key="id">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <StatusTag :status="record.status" />
      </template>
      <template v-else-if="column.key === 'actions'">
        <ContainerActions :container="record" @delete="emit('delete', record.id)" />
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import type { Container } from '@nakhoda/shared/types';
import StatusTag from '@/components/StatusTag.vue';
import ContainerActions from '@/components/ContainerActions.vue';

interface Props {
  containers: Container[];
  loading: boolean;
}

const emit = defineEmits<{ delete: [id: string] }>();

defineProps<Props>();

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Image', dataIndex: 'image', key: 'image' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Rudder', dataIndex: 'rudderId', key: 'rudderId' },
  { title: 'Actions', key: 'actions' },
];
</script>
