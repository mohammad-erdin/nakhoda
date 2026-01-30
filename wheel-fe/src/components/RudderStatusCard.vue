<template>
  <div class="card">
    <div class="flex flex--between">
      <div>
        <div class="card__title">{{ rudder.hostname }}</div>
        <div class="muted">{{ rudder.dockerVersion }}</div>
      </div>
      <StatusTag :status="rudder.status" />
    </div>
    <div class="card__meta">Last heartbeat: {{ formatDate(rudder.lastHeartbeat) }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Rudder } from '@nakhoda/shared/types';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate } from '@/utils/format';

interface Props {
  rudder: Rudder;
}

defineProps<Props>();
</script>

<style scoped>
.card__title {
  font-weight: 600;
}

.card__meta {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-muted);
}
</style>
