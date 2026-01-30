<template>
  <div class="page">
    <div class="page__title">Rudder Detail</div>
    <div v-if="rudder" class="card">
      <div class="flex flex--between">
        <div>
          <div class="card__title">{{ rudder.hostname }}</div>
          <div class="muted">{{ rudder.dockerVersion }}</div>
        </div>
        <StatusTag :status="rudder.status" />
      </div>
      <div class="detail">
        <div><strong>ID:</strong> {{ rudder.id }}</div>
        <div><strong>Last heartbeat:</strong> {{ formatDate(rudder.lastHeartbeat) }}</div>
      </div>
    </div>
    <EmptyState v-else message="Rudder not found." />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRudders } from '@/stores/rudders';
import StatusTag from '@/components/StatusTag.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate } from '@/utils/format';

const route = useRoute();
const rudders = useRudders();

const rudder = computed(() =>
  rudders.rudders.find((r: import('@nakhoda/shared/types').Rudder) => r.id === route.params.id)
);

onMounted(() => {
  if (!rudders.rudders.length) rudders.getRudders();
});
</script>

<style scoped>
.detail {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
