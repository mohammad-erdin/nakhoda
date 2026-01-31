export interface JobResult {
  jobId: string;
  status: 'done' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
}

export interface JobPayload {
  job_id: string;
  action: string;
  params: Record<string, unknown>;
}
