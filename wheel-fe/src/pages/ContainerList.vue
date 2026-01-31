<template>
  <div class="page">
    <div class="flex flex--between">
      <div class="page__title">Containers</div>
      <a-button type="primary" @click="$router.push('/containers/create')">Create</a-button>
    </div>

    <div class="filters">
      <a-select v-model:value="filters.rudder" placeholder="Server" allowClear @change="applyFilters" style="width: 200px">
        <a-select-option v-for="r in rudders.rudders" :key="r.id" :value="r.id">{{ r.hostname || r.id }}</a-select-option>
      </a-select>

      <a-select v-model:value="filters.status" placeholder="Status" allowClear @change="applyFilters" style="width: 140px">
        <a-select-option value="running">Running</a-select-option>
        <a-select-option value="stopped">Stopped</a-select-option>
        <a-select-option value="exited">Exited</a-select-option>
      </a-select>

      <div class="filters__spacer"></div>

      <a-input v-model:value="filters.image" placeholder="Search..." style="width: 200px" @input="applyFilters" />
    </div>

    <ContainerTable :containers="containers.paginatedContainers" :loading="containers.loading" @delete="handleDelete" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useContainers } from '@/stores/containers';
import { useRudders } from '@/stores/rudders';
import ContainerTable from '@/components/ContainerTable.vue';

const containers = useContainers();
const rudders = useRudders();

const filters = reactive({
  status: '',
  rudder: '',
  image: '',
});

const applyFilters = () => {
  containers.setFilters(filters);
};

const handleDelete = (id: string) => {
  containers.deleteContainer(id);
};

onMounted(() => {
  containers.getContainers();
  rudders.getRudders();
});
</script>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  margin: 16px 0;
  align-items: center;
}

.filters__spacer {
  flex: 1;
}
</style>
