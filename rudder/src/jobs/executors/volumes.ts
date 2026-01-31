import { DockerClient } from '../../docker/client.js';
import { logger } from '../../utils/logger.js';
import type { JobResult } from '../types.js';

export class VolumeExecutor {
  constructor(private docker: DockerClient) {}

  async create(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const volume = await this.docker.createVolume({
        name: params.name as string,
        driver: params.driver as string | undefined,
        labels: params.labels as Record<string, string> | undefined,
      });

      return {
        jobId,
        status: 'done',
        result: {
          name: volume.name,
          driver: volume.driver,
          mountPoint: volume.mountPoint,
        },
      };
    } catch (error) {
      logger.error(`Volume create failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async delete(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const volumeId = params.volumeId as string;
      await this.docker.removeVolume(volumeId);

      return {
        jobId,
        status: 'done',
        result: { volumeId },
      };
    } catch (error) {
      logger.error(`Volume delete failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}
