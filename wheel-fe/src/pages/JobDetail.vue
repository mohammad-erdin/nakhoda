<template>
  <div class="page">
    <div class="page__header">
      <a-button type="link" @click="$router.back()" style="padding-left: 0">
        <i class="ri-arrow-left-line"></i> Back
      </a-button>
    </div>

    <div v-if="loading" class="page__loading">
      <a-spin size="large" />
    </div>

    <div v-else-if="error" class="page__error">
      <a-alert type="error" :message="error" show-icon />
    </div>

    <div v-else-if="job" class="job-detail">
      <!-- Header -->
      <div class="job-detail__header">
        <div>
          <h1 class="job-detail__title">Job Details</h1>
          <div class="job-detail__id">{{ job.id }}</div>
        </div>
        <div class="job-detail__actions">
          <a-button @click="copyJobId" type="default">
            <i class="ri-clipboard-line"></i> Copy ID
          </a-button>
          <a-button
            v-if="job.status === 'failed'"
            @click="handleRetry"
            type="primary"
            :loading="retrying"
          >
            <i class="ri-restart-line"></i> Retry
          </a-button>
        </div>
      </div>

      <!-- Metadata Card -->
      <a-card title="Metadata" class="job-detail__card">
        <div class="metadata">
          <div class="metadata__item">
            <span class="metadata__label">Action</span>
            <span class="metadata__value">{{ job.action }}</span>
          </div>
          <div class="metadata__item">
            <span class="metadata__label">Rudder ID</span>
            <span class="metadata__value">{{ job.rudderId }}</span>
          </div>
          <div class="metadata__item">
            <span class="metadata__label">Status</span>
            <StatusTag :status="job.status" />
          </div>
          <div class="metadata__item">
            <span class="metadata__label">Created At</span>
            <span class="metadata__value">{{ formatDate(job.createdAt) }}</span>
          </div>
          <div class="metadata__item" v-if="job.startedAt">
            <span class="metadata__label">Started At</span>
            <span class="metadata__value">{{ formatDate(job.startedAt) }}</span>
          </div>
          <div class="metadata__item" v-if="job.completedAt">
            <span class="metadata__label">Completed At</span>
            <span class="metadata__value">{{ formatDate(job.completedAt) }}</span>
          </div>
          <div class="metadata__item" v-if="job.startedAt && job.completedAt">
            <span class="metadata__label">Duration</span>
            <span class="metadata__value">{{ formatDuration(job.startedAt, job.completedAt) }}</span>
          </div>
        </div>
      </a-card>

      <!-- Parameters Card -->
      <a-card title="Parameters" class="job-detail__card">
        <pre class="json-viewer">{{ JSON.stringify(job.params, null, 2) }}</pre>
      </a-card>

      <!-- Result Card -->
      <a-card v-if="job.result" title="Result" class="job-detail__card">
        <pre class="json-viewer">{{ JSON.stringify(job.result, null, 2) }}</pre>
      </a-card>

      <!-- Error Card -->
      <a-card v-if="job.error" title="Error" class="job-detail__card">
        <a-alert type="error" :message="job.error" show-icon />
      </a-card>

      <!-- Logs Card -->
      <a-card v-if="job.logs && job.logs.length > 0" title="Logs" class="job-detail__card">
        <div class="logs">
          <div v-for="log in job.logs" :key="log.id" class="log-entry">
            <span class="log-entry__time">{{ formatTime(log.createdAt) }}</span>
            <a-tag :color="getLogLevelColor(log.level)" class="log-entry__level">
              {{ log.level?.toUpperCase() ?? 'INFO' }}
            </a-tag>
            <span class="log-entry__message">{{ log.message }}</span>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useJobs } from '@/stores/jobs';
import StatusTag from '@/components/StatusTag.vue';
import { formatDate, formatDuration } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const jobsStore = useJobs();

const job = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const retrying = ref(false);

const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const getLogLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'red';
    case 'warn':
      return 'orange';
    case 'info':
      return 'blue';
    default:
      return 'default';
  }
};

const copyJobId = async () => {
  try {
    await navigator.clipboard.writeText(job.value.id);
    message.success('Job ID copied to clipboard');
  } catch (err) {
    message.error('Failed to copy job ID');
  }
};

const handleRetry = async () => {
  if (!job.value) return;
  
  retrying.value = true;
  try {
    const result = await jobsStore.retryJob(job.value.id);
    message.success(`Job retried successfully. New job ID: ${result.newJobId}`);
    router.push(`/jobs/${result.newJobId}`);
  } catch (err) {
    message.error('Failed to retry job');
  } finally {
    retrying.value = false;
  }
};

const loadJobDetail = async () => {
  loading.value = true;
  error.value = null;
  try {
    job.value = await jobsStore.getJobDetail(route.params.id as string);
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadJobDetail();
});
</script>

<style scoped lang="scss">
.page__header {
  margin-bottom: 16px;
}

.page__loading,
.page__error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.job-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.job-detail__title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.job-detail__id {
  color: #666;
  font-family: monospace;
  font-size: 14px;
}

.job-detail__actions {
  display: flex;
  gap: 8px;
}

.job-detail__card {
  margin-bottom: 16px;
}

.metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.metadata__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata__label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

.metadata__value {
  font-size: 14px;
  color: #000;
}

.json-viewer {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 13px;
  margin: 0;
}

.logs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.log-entry__time {
  color: #666;
  min-width: 90px;
}

.log-entry__level {
  min-width: 60px;
  text-align: center;
}

.log-entry__message {
  flex: 1;
  color: #000;
}
</style>
