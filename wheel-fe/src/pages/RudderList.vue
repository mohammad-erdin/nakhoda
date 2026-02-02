<template>
  <div class="page px-6 py-6">
    <div class="flex flex--between items-center">
      <div class="page__title text-2xl font-semibold mb-0">Servers</div>
      <a-button @click="rudders.getRudders" :loading="rudders.loading">Refresh</a-button>
    </div>
    <RudderTable :rudders="rudders.rudders" :loading="rudders.loading" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRudders } from '@/stores/rudders';
import RudderTable from '@/components/RudderTable.vue';

const rudders = useRudders();

onMounted(() => {
  rudders.getRudders();
});
</script>
