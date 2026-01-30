<template>
  <div class="card">
    <div class="flex flex--between">
      <div>
        <div class="card__title">Jobs Summary</div>
        <div class="muted">Last 24 hours</div>
      </div>
      <a-button type="link" @click="$router.push('/jobs')">View</a-button>
    </div>
    <div class="summary">
      <div class="summary__item">
        <span class="muted">Pending</span>
        <strong>{{ counts.pending }}</strong>
      </div>
      <div class="summary__item">
        <span class="muted">Running</span>
        <strong>{{ counts.running }}</strong>
      </div>
      <div class="summary__item">
        <span class="muted">Done</span>
        <strong>{{ counts.done }}</strong>
      </div>
      <div class="summary__item">
        <span class="muted">Failed</span>
        <strong>{{ counts.failed }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  counts: { pending: number; running: number; done: number; failed: number };
}

defineProps<Props>();
</script>

<style scoped>
.card__title {
  font-weight: 600;
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.summary__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
