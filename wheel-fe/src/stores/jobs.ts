import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Job, JobStatus } from '@nakhoda/shared/types';
import { apiGet, apiPost } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@nakhoda/shared/constants';

export const useJobs = defineStore('jobs', () => {
  const jobs = ref<Job[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getJobs = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiGet<any>(API_ENDPOINTS.JOBS.LIST);
      // Handle both direct array and paginated response
      jobs.value = Array.isArray(response) ? response : (response.items || []);
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      loading.value = false;
    }
  };

  const getJobDetail = async (id: string) => {
    return apiGet<Job>(API_ENDPOINTS.JOBS.DETAIL(id));
  };

  const retryJob = async (id: string) => {
    return apiPost<Job>(API_ENDPOINTS.JOBS.RETRY(id));
  };

  const markJobComplete = (jobId: string, status: 'done' | 'failed') => {
    const job = jobs.value.find((j: Job) => j.id === jobId);
    if (job) {
      job.status = status as JobStatus;
      job.completedAt = new Date().toISOString();
    }
  };

  return { jobs, loading, error, getJobs, getJobDetail, retryJob, markJobComplete };
});
