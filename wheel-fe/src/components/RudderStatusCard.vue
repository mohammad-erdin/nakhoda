<template>
  <div class="card rudder-card">
    <div class="rudder-card__header flex flex--between">
      <div class="rudder-card__left">
        <div class="rudder-card__title">{{ rudder.hostname }}</div>
        <div class="rudder-card__sub muted">
          <StatusTag :status="rudder.status" />
        </div>
      </div>
    </div>

    <div class="rudder-card__meta">
      <div class="meta-item">
        <i class="ri-terminal-box-line ri-1x" />
        <span class="meta-label">{{ rudder.dockerVersion || '—' }}</span>
      </div>

      <div class="meta-divider" />

      <div class="meta-item">
        <i class="ri-global-line ri-1x" />
        <span class="meta-label">{{ rudder.ip || 'Unknown IP' }}</span>
      </div>

      <div class="meta-divider" />

      <div class="meta-item">
        <i class="ri-cpu-line ri-1x" />
        <span class="meta-label">{{ rudder.cores ?? '—' }} Cores</span>
      </div>

      <div class="meta-divider" />

      <div class="meta-item">
        <i class="ri-dashboard-line ri-1x" />
        <span class="meta-label">{{ rudder.load ?? '—' }}</span>
      </div>

      <div class="meta-divider" />

      <div class="meta-item">
        <i class="ri-memory-line ri-1x" />
        <span class="meta-label">{{ rudder.memoryUsed ? `${rudder.memoryUsed} GB` : '—' }}</span>
      </div>

      <div class="meta-divider" />

      <div class="meta-item">
        <i class="ri-hard-drive-2-line ri-1x" />
        <span class="meta-label">{{ rudder.diskUsed ? `${rudder.diskUsed} GB` : '—' }}</span>
      </div>
    </div>

    <div class="rudder-card__tags">
      <template v-if="(rudder.tags || []).length">
        <span v-for="t in rudder.tags" :key="t" class="chip">{{ t }}</span>
      </template>
      <div class="card__meta">Last heartbeat: {{ formatDate(rudder.lastHeartbeat) }}</div>
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

defineProps<Props>();
</script>

<style scoped>
.rudder-card__header {
  align-items: center;
}

.rudder-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text) !important;
}

.rudder-card__sub {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  font-size: 13px;
}

.rudder-card__region {
  color: var(--color-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
}

.pill {
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 6px 10px;
  border-radius: 999px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.switch {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.switch input {
  display: none;
}

.switch .slider {
  width: 36px;
  height: 18px;
  background: var(--color-border);
  border-radius: 18px;
  display: inline-block;
  position: relative;
}

.switch input:checked + .slider {
  background: var(--color-primary);
}

.switch .slider::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.18s ease;
}

.switch input:checked + .slider::after {
  transform: translateX(18px);
}

.rudder-card__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--color-muted);
  font-size: 13px;
}

.meta-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  opacity: 0.6;
}

.chip {
  display: inline-block;
  background: var(--color-surface-variant);
  color: var(--color-text);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  margin-right: 8px;
  margin-top: 12px;
}

.card__meta {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-muted);
}
</style>
