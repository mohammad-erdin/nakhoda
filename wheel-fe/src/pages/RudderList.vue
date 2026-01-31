<template>
  <div class="page">
    <div class="flex flex--between">
      <div class="page__title">Servers</div>
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
