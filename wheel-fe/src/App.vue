<template>
  <div>
    <div v-if="!auth.checked" class="flex items-center justify-center h-screen">
      <a-spin size="large" tip="Checking session..." />
    </div>

    <AppLayout v-else-if="showLayout">
      <router-view />
    </AppLayout>

    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';
import AppLayout from '@/components/AppLayout.vue';
const route = useRoute();
const auth = useAuth();
const showLayout = computed(() => route.meta.requiresAuth !== false && auth.checked);
</script>
