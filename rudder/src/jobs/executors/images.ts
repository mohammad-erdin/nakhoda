import { DockerClient } from '../../docker/client.js';
import { logger } from '../../utils/logger.js';
import type { JobResult } from '../types.js';

export class ImageExecutor {
  constructor(private docker: DockerClient) {}

  async pull(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const repo = params.repo as string;
      const image = await this.docker.pullImage(repo);

      return {
        jobId,
        status: 'done',
        result: {
          imageId: image.id,
          repo: image.repo,
          tag: image.tag,
          size: image.size,
        },
      };
    } catch (error) {
      logger.error(`Image pull failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async delete(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const imageId = params.imageId as string;
      const force = params.force as boolean | undefined;
      await this.docker.removeImage(imageId, force);

      return {
        jobId,
        status: 'done',
        result: { imageId },
      };
    } catch (error) {
      logger.error(`Image delete failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}
