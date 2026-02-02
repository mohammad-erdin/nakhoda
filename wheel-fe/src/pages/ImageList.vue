<template>
  <div class="page">
    <div class="flex flex--between">
      <div class="page__title">Images</div>
      <a-button type="primary" @click="showPullModal = true">Pull Image</a-button>
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

    <a-table :columns="columns" :data-source="images.images" :loading="images.loading" row-key="id" />

    <a-modal v-model:open="showPullModal" title="Pull Image" @ok="handlePull">
      <a-form layout="vertical">
        <a-form-item label="Rudder ID">
          <a-select v-model:value="pullForm.rudder_id" placeholder="Server" allowClear>
            <a-select-option v-for="r in rudders.rudders" :key="r.id" :value="r.id">{{ r.hostname || r.id }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Image">
          <a-input v-model:value="pullForm.image" placeholder="redis:latest" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useImages } from '@/stores/images';
import { useRudders } from '@/stores/rudders';
import { formatBytes, formatDate } from '@/utils/format';

const images = useImages();
const rudders = useRudders();
const showPullModal = ref(false);
const pullForm = reactive({
  rudder_id: '',
  image: '',
});

const filters = reactive({ rudder: '' });

const columns = [
  { title: 'Repo', dataIndex: 'repo', key: 'repo' },
  { title: 'Tag', dataIndex: 'tag', key: 'tag' },
  { title: 'Size', dataIndex: 'size', key: 'size', customRender: ({ text }: any) => formatBytes(text) },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', customRender: ({ text }: any) => formatDate(text) },
];

const handlePull = async () => {
  await images.pullImage(pullForm);
  showPullModal.value = false;
  images.getImages(filters.rudder || '');
};

const onRudderChange = (value: string) => {
  filters.rudder = value;
  images.getImages(filters.rudder || '');
};

onMounted(() => {
  images.getImages();
  rudders.getRudders();
});

// Choose default rudder when available
watch(
  () => rudders.rudders.length,
  (len) => {
    if (len > 0 && !filters.rudder) {
      const preferred = rudders.onlineRudders.length ? rudders.onlineRudders[0] : rudders.rudders[0];
      filters.rudder = preferred.id;
      pullForm.rudder_id = preferred.id;
      images.getImages(filters.rudder);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.filters {
  display: flex;
  gap: 12px;
  margin: 16px 0;
  align-items: center;
  justify-content: flex-start;
}

.filters__spacer {
  flex: 1;
}
</style>
