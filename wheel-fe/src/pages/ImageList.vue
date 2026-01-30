<template>
  <div class="page">
    <div class="flex flex--between">
      <div class="page__title">Images</div>
      <a-button type="primary" @click="showPullModal = true">Pull Image</a-button>
    </div>

    <a-table :columns="columns" :data-source="images.images" :loading="images.loading" row-key="id" />

    <a-modal v-model:open="showPullModal" title="Pull Image" @ok="handlePull">
      <a-form layout="vertical">
        <a-form-item label="Rudder ID">
          <a-input v-model:value="pullForm.rudder_id" />
        </a-form-item>
        <a-form-item label="Image">
          <a-input v-model:value="pullForm.image" placeholder="redis:latest" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useImages } from '@/stores/images';
import { formatBytes, formatDate } from '@/utils/format';

const images = useImages();
const showPullModal = ref(false);
const pullForm = reactive({
  rudder_id: '',
  image: '',
});

const columns = [
  { title: 'Repo', dataIndex: 'repo', key: 'repo' },
  { title: 'Tag', dataIndex: 'tag', key: 'tag' },
  { title: 'Size', dataIndex: 'size', key: 'size', customRender: ({ text }: any) => formatBytes(text) },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', customRender: ({ text }: any) => formatDate(text) },
];

const handlePull = async () => {
  await images.pullImage(pullForm);
  showPullModal.value = false;
  images.getImages();
};

onMounted(() => {
  images.getImages();
});
</script>
