<template>
  <div class="page">
    <div class="flex flex--between">
      <div class="page__title">Volumes</div>
    </div>

    <a-card class="filters-card">
      <a-form layout="inline" class="filters-form">
        <a-form-item label="Server">
          <a-select v-model:value="filters.rudder" placeholder="Server" allowClear @change="onRudderChange" style="width: 200px">
            <a-select-option v-for="r in rudders.rudders" :key="r.id" :value="r.id">{{ r.hostname || r.id }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-card> 

    <a-table :columns="columns" :data-source="volumes.volumes" :loading="volumes.loading" row-key="id" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useVolumes } from '@/stores/volumes';
import { useRudders } from '@/stores/rudders';
import { formatDate } from '@/utils/format';

const volumes = useVolumes();
const rudders = useRudders();

const filters = reactive({ rudder: '' });

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Driver', dataIndex: 'driver', key: 'driver' },
  { title: 'Mount', dataIndex: 'mountPoint', key: 'mountPoint' },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', customRender: ({ text }: any) => formatDate(text) },
];

const onRudderChange = (value: string) => {
  filters.rudder = value;
  volumes.getVolumes(filters.rudder || '');
};

onMounted(() => {
  volumes.getVolumes();
  rudders.getRudders();
});

// choose default rudder
watch(
  () => rudders.rudders.length,
  (len) => {
    if (len > 0 && !filters.rudder) {
      const preferred = rudders.onlineRudders.length ? rudders.onlineRudders[0] : rudders.rudders[0];
      filters.rudder = preferred.id;
      volumes.getVolumes(filters.rudder);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@import '@/styles/mixins';
@import '@/styles/variables';

.filters {
  display: flex;
  gap: 12px;
  margin: $spacing-md 0;
  align-items: center;
  justify-content: flex-start;

  &__spacer {
    flex: 1;
  }
}
</style>
