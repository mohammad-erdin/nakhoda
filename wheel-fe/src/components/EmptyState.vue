<template>
  <div class="empty">
    <i class="ri-inbox-2-line"></i>
    <p>{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string;
}

defineProps<Props>();
</script>

<style scoped>
.empty {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
}

.empty i {
  font-size: 24px;
}
</style>
