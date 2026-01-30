<template>
  <div class="stat-card">
    <div class="stat-card__label">{{ label }}</div>
    <div class="stat-card__value">{{ value }}</div>
    <div class="stat-card__meta">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: string | number;
}

defineProps<Props>();
</script>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-width: 180px;
}

.stat-card__label {
  color: var(--color-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card__value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 6px;
}

.stat-card__meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-muted);
}
</style>
