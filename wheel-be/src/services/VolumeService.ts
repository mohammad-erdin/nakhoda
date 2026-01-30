import * as JobService from './JobService.js';
import * as RudderService from './RudderService.js';
import { logger } from '../utils/logger.js';

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

  return {
    jobId: job.id,
    status: job.status,
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

  return {
    jobId: job.id,
    status: job.status,
    message: 'Volume deletion queued',
  };
}
