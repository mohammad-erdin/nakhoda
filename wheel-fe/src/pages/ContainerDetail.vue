<template>
  <div class="page px-6 py-6">
    <div class="page__title text-2xl font-semibold mb-0">Container Detail</div>
    <div v-if="container" class="card">
      <div class="flex flex--between">
        <div>
          <div class="text-lg font-semibold">{{ container.name }}</div>
          <div class="muted">{{ container.image }}</div>
        </div>
        <StatusTag :status="container.status" />
      </div>
      <div class="detail">
        <div><strong>ID:</strong> {{ container.id }}</div>
        <div><strong>Server:</strong> {{ container.rudderId }}</div>
      </div>
    </div>
    <EmptyState v-else message="Container not found." />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useContainers } from '@/stores/containers';
import StatusTag from '@/components/StatusTag.vue';
import EmptyState from '@/components/EmptyState.vue';

const route = useRoute();
const containers = useContainers();

const container = computed(() =>
  containers.containers.find((c: import('@nakhoda/shared/types').Container) => c.id === route.params.id)
);

onMounted(() => {
  if (!containers.containers.length) containers.getContainers();
});
</script>
