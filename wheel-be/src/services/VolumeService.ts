import * as JobService from './JobService.js';
import * as RudderService from './RudderService.js';
import { logger } from '../utils/logger.js';
import { dispatchJob } from '../websocket/index.js';

const JOB_ACTIONS = {
  VOLUME_CREATE: 'volume.create',
  VOLUME_DELETE: 'volume.delete',
} as const;

export interface CreateVolumeInput {
  rudderId: string;
  name: string;
  driver?: string;
  labels?: Record<string, string>;
}

export interface VolumeActionResult {
  jobId: string;
  status: string;
  message?: string;
}

export async function createVolume(input: CreateVolumeInput): Promise<VolumeActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.VOLUME_CREATE,
    params: {
      name: input.name,
      driver: input.driver || 'local',
      labels: input.labels,
    },
  });

  logger.info('Volume create job created', { jobId: job.id, name: input.name, rudderId: input.rudderId });

  // Dispatch job to rudder
  await dispatchJob(input.rudderId, job.id, JOB_ACTIONS.VOLUME_CREATE, job.params);

  return {
    jobId: job.id,
    status: 'running',
  };
}

export interface DeleteVolumeInput {
  rudderId: string;
  volumeId: string;
  force?: boolean;
}

export async function deleteVolume(input: DeleteVolumeInput): Promise<VolumeActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.VOLUME_DELETE,
    params: { volumeId: input.volumeId, force: input.force },
  });

  // Dispatch job to rudder
  await dispatchJob(input.rudderId, job.id, JOB_ACTIONS.VOLUME_DELETE, job.params);

  return {
    jobId: job.id,
    status: 'running',
    message: 'Volume deletion queued',
  };
}
