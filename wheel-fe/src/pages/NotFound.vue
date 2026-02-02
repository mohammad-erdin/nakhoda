<template>
  <div class="page px-6 py-6">
    <div class="card">
      <h2 class="text-2xl font-semibold">Page not found</h2>
      <p class="muted">The page you requested does not exist.</p>
      <a-button type="primary" @click="$router.push('/')">Go to Dashboard</a-button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
