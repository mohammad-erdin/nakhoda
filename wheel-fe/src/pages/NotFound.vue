<template>
  <div class="page">
    <div class="card">
      <h2>Page not found</h2>
      <p class="muted">The page you requested does not exist.</p>
      <a-button type="primary" @click="$router.push('/')">Go to Dashboard</a-button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
