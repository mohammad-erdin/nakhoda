<template>
  <div class="page">
    <div class="page__title">Volumes</div>
    <a-table :columns="columns" :data-source="volumes.volumes" :loading="volumes.loading" row-key="id" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useVolumes } from '@/stores/volumes';
import { formatDate } from '@/utils/format';

const volumes = useVolumes();

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Driver', dataIndex: 'driver', key: 'driver' },
  { title: 'Mount', dataIndex: 'mountPoint', key: 'mountPoint' },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', customRender: ({ text }: any) => formatDate(text) },
];

onMounted(() => {
  volumes.getVolumes();
});
</script>
