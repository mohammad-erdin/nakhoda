<template>
  <div class="card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
    <div class="font-semibold mb-3">Quick Actions</div>
    <div class="flex flex-wrap gap-3">
      <a-button type="primary" @click="$router.push('/containers/create')">Create Container</a-button>
      <a-button @click="$router.push('/images')">Pull Image</a-button>
      <a-button @click="$router.push('/rudders')">View Server</a-button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
