<template>
  <div class="page">
    <div class="page__title">Rudder Detail</div>
    <div v-if="rudder">
      <RudderStatusCard :rudder="rudder" />
    </div>
    <EmptyState v-else message="Rudder not found." />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRudders } from '@/stores/rudders';
import StatusTag from '@/components/StatusTag.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate } from '@/utils/format';
import RudderStatusCard from '@/components/RudderStatusCard.vue';

const route = useRoute();
const rudders = useRudders();

const rudder = computed(() =>
  rudders.rudders.find((r: import('@nakhoda/shared/types').Rudder) => r.id === route.params.id)
);

onMounted(() => {
  if (!rudders.rudders.length) rudders.getRudders();
});
</script>
