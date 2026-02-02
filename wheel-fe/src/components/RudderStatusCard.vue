<template>
  <div class="card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-lg font-bold text-[var(--color-text)]">{{ rudder.hostname }}</div>
        <div class="flex items-center gap-2 mt-1 text-[var(--color-muted)]">
          <StatusTag :status="rudder.status" />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)] text-[var(--color-muted)] text-sm">
      <div class="flex items-center gap-2"><i class="ri-terminal-box-line ri-1x" /><span>{{ rudder.dockerVersion || '—' }}</span></div>
      <div class="flex items-center gap-2"><i class="ri-global-line ri-1x" /><span>{{ rudder.ip || 'Unknown IP' }}</span></div>
      <div class="flex items-center gap-2"><i class="ri-cpu-line ri-1x" /><span>{{ rudder.cores ?? '—' }} Cores</span></div>
      <div class="flex items-center gap-2"><i class="ri-dashboard-line ri-1x" /><span>{{ rudder.load ?? '—' }}</span></div>
      <div class="flex items-center gap-2"><i class="ri-memory-line ri-1x" /><span>{{ rudder.memoryUsed ? `${rudder.memoryUsed} GB` : '—' }}</span></div>
      <div class="flex items-center gap-2"><i class="ri-hard-drive-2-line ri-1x" /><span>{{ rudder.diskUsed ? `${rudder.diskUsed} GB` : '—' }}</span></div>
    </div>

    <div class="mt-3">
      <template v-if="(rudder.tags || []).length">
        <div class="flex flex-wrap gap-2">
          <span v-for="t in rudder.tags" :key="t" class="inline-block bg-[var(--color-surface-variant)] text-[var(--color-text)] px-2 py-1 rounded-full text-sm">{{ t }}</span>
        </div>
      </template>
      <div class="text-sm mt-3 text-[var(--color-muted)]">Last heartbeat: {{ formatDate(rudder.lastHeartbeat) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Rudder } from '@nakhoda/shared/types';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate } from '@/utils/format';

interface Props {
  rudder: Rudder;
}

const props = defineProps<Props>() as any;
const rudder = props.rudder;
</script>
