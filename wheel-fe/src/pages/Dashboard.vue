<template>
  <div class="page">
    <div class="page__title">Dashboard</div>

    <div class="stats">
      <StatCard label="Online Rudders" :value="onlineRudders">
        {{ rudders.rudders.length }} total
      </StatCard>
      <StatCard label="Containers" :value="containers.containers.length">
        {{ runningContainers }} running
      </StatCard>
      <StatCard label="Jobs" :value="jobs.jobs.length">
        {{ failedJobs }} failed
      </StatCard>
    </div>

    <div class="grid">
      <JobSummary :counts="jobCounts" />
      <QuickActions />
    </div>

    <div class="page__title">Rudder Status</div>
    <div class="rudder-grid" v-if="rudders.rudders.length">
      <RudderStatusCard v-for="rudder in rudders.rudders" :key="rudder.id" :rudder="rudder" />
    </div>
    <EmptyState v-else message="No rudders registered yet." />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRudders } from '@/stores/rudders';
import { useContainers } from '@/stores/containers';
import { useJobs } from '@/stores/jobs';
import StatCard from '@/components/StatCard.vue';
import JobSummary from '@/components/JobSummary.vue';
import QuickActions from '@/components/QuickActions.vue';
import RudderStatusCard from '@/components/RudderStatusCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const rudders = useRudders();
const containers = useContainers();
const jobs = useJobs();

const onlineRudders = computed(() => rudders.onlineRudders.length);
const runningContainers = computed(() =>
  containers.containers.filter((c: import('@nakhoda/shared/types').Container) => c.status === 'running').length
);
const failedJobs = computed(() =>
  jobs.jobs.filter((j: import('@nakhoda/shared/types').Job) => j.status === 'failed').length
);

const jobCounts = computed(() => ({
  pending: jobs.jobs.filter((j: import('@nakhoda/shared/types').Job) => j.status === 'pending').length,
  running: jobs.jobs.filter((j: import('@nakhoda/shared/types').Job) => j.status === 'running').length,
  done: jobs.jobs.filter((j: import('@nakhoda/shared/types').Job) => j.status === 'done').length,
  failed: jobs.jobs.filter((j: import('@nakhoda/shared/types').Job) => j.status === 'failed').length,
}));

onMounted(() => {
  rudders.getRudders();
  containers.getContainers();
  jobs.getJobs();
});
</script>

<style scoped>
.stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.rudder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
</style>
