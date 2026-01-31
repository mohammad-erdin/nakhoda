<template>
  <div class="card">
    <div class="card__title">Quick Actions</div>
    <div class="actions">
      <a-button type="primary" @click="$router.push('/containers/create')">Create Container</a-button>
      <a-button @click="$router.push('/images')">Pull Image</a-button>
      <a-button @click="$router.push('/rudders')">View Server</a-button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.card__title {
  font-weight: 600;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
