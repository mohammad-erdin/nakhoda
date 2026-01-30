import * as JobService from './JobService.js';
import * as RudderService from './RudderService.js';
import { logger } from '../utils/logger.js';

const JOB_ACTIONS = {
  CONTAINER_CREATE: 'container.create',
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_RESTART: 'container.restart',
  CONTAINER_DELETE: 'container.delete',
} as const;

export interface CreateContainerInput {
  rudderId: string;
  image: string;
  name: string;
  ports?: Record<string, number>;
  env?: Record<string, string>;
  mounts?: Array<{ source: string; destination: string }>;
  cmd?: string[];
}

export interface ContainerActionResult {
  jobId: string;
  status: string;
}

export async function createContainer(input: CreateContainerInput): Promise<ContainerActionResult> {
  // Ensure rudder is online
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.CONTAINER_CREATE,
    params: {
      image: input.image,
      name: input.name,
      ports: input.ports,
      env: input.env,
      mounts: input.mounts,
      cmd: input.cmd,
    },
  });

  logger.info('Container create job created', { jobId: job.id, rudderId: input.rudderId });

  return {
    jobId: job.id,
    status: job.status,
  };
}

export interface ContainerCommandInput {
  containerId: string;
  rudderId: string;
}

export async function startContainer(input: ContainerCommandInput): Promise<ContainerActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.CONTAINER_START,
    params: { containerId: input.containerId },
  });

  return { jobId: job.id, status: job.status };
}

export async function stopContainer(input: ContainerCommandInput): Promise<ContainerActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.CONTAINER_STOP,
    params: { containerId: input.containerId },
  });

  return { jobId: job.id, status: job.status };
}

export async function restartContainer(input: ContainerCommandInput): Promise<ContainerActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.CONTAINER_RESTART,
    params: { containerId: input.containerId },
  });

  return { jobId: job.id, status: job.status };
}

export async function deleteContainer(
  input: ContainerCommandInput & { force?: boolean }
): Promise<ContainerActionResult> {
  await RudderService.ensureRudderOnline(input.rudderId);

  const job = await JobService.createJob({
    rudderId: input.rudderId,
    action: JOB_ACTIONS.CONTAINER_DELETE,
    params: { containerId: input.containerId, force: input.force },
  });

  return { jobId: job.id, status: job.status };
}
