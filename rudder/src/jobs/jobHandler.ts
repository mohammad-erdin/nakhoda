import { DockerClient } from '../docker/client.js';
import { ContainerExecutor } from './executors/containers.js';
import { ImageExecutor } from './executors/images.js';
import { VolumeExecutor } from './executors/volumes.js';
import { logger } from '../utils/logger.js';
import type { JobPayload, JobResult } from './types.js';

const JOB_ACTIONS = {
  CONTAINER_CREATE: 'container.create',
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_RESTART: 'container.restart',
  CONTAINER_DELETE: 'container.delete',
  IMAGE_PULL: 'image.pull',
  IMAGE_DELETE: 'image.delete',
  VOLUME_CREATE: 'volume.create',
  VOLUME_DELETE: 'volume.delete',
} as const;

export class JobHandler {
  private containerExecutor: ContainerExecutor;
  private imageExecutor: ImageExecutor;
  private volumeExecutor: VolumeExecutor;

  constructor(docker: DockerClient) {
    this.containerExecutor = new ContainerExecutor(docker);
    this.imageExecutor = new ImageExecutor(docker);
    this.volumeExecutor = new VolumeExecutor(docker);
  }

  async executeJob(payload: JobPayload): Promise<JobResult> {
    const { job_id, action, params } = payload;
    logger.info(`Executing job: ${action}`, { jobId: job_id });

    const startTime = Date.now();

    try {
      let result: JobResult;

      switch (action) {
        case JOB_ACTIONS.CONTAINER_CREATE:
          result = await this.containerExecutor.create(job_id, params);
          break;

        case JOB_ACTIONS.CONTAINER_START:
          result = await this.containerExecutor.start(job_id, params);
          break;

        case JOB_ACTIONS.CONTAINER_STOP:
          result = await this.containerExecutor.stop(job_id, params);
          break;

        case JOB_ACTIONS.CONTAINER_RESTART:
          result = await this.containerExecutor.restart(job_id, params);
          break;

        case JOB_ACTIONS.CONTAINER_DELETE:
          result = await this.containerExecutor.delete(job_id, params);
          break;

        case JOB_ACTIONS.IMAGE_PULL:
          result = await this.imageExecutor.pull(job_id, params);
          break;

        case JOB_ACTIONS.IMAGE_DELETE:
          result = await this.imageExecutor.delete(job_id, params);
          break;

        case JOB_ACTIONS.VOLUME_CREATE:
          result = await this.volumeExecutor.create(job_id, params);
          break;

        case JOB_ACTIONS.VOLUME_DELETE:
          result = await this.volumeExecutor.delete(job_id, params);
          break;

        default:
          logger.warn(`Unknown action: ${action}`);
          result = {
            jobId: job_id,
            status: 'failed',
            error: `Unknown action: ${action}`,
          };
      }

      const duration = Date.now() - startTime;
      logger.info(`Job completed: ${action}`, { jobId: job_id, status: result.status, duration: `${duration}ms` });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Job failed: ${action}`, { jobId: job_id, error: (error as Error).message, duration: `${duration}ms` });

      return {
        jobId: job_id,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}
