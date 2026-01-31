import { DockerClient } from '../../docker/client.js';
import { logger } from '../../utils/logger.js';
import type { JobResult } from '../types.js';

export class ContainerExecutor {
  constructor(private docker: DockerClient) {}

  async create(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const container = await this.docker.createContainer({
        image: params.image as string,
        name: params.name as string,
        ports: params.ports as Record<string, number> | undefined,
        env: params.env as Record<string, string> | undefined,
        mounts: params.mounts as Array<{ source: string; destination: string }> | undefined,
        cmd: params.cmd as string[] | undefined,
      });

      return {
        jobId,
        status: 'done',
        result: {
          containerId: container.id,
          name: container.name,
          status: container.status,
        },
      };
    } catch (error) {
      logger.error(`Container create failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async start(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const containerId = params.containerId as string;
      await this.docker.startContainer(containerId);

      return {
        jobId,
        status: 'done',
        result: { containerId },
      };
    } catch (error) {
      logger.error(`Container start failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async stop(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const containerId = params.containerId as string;
      await this.docker.stopContainer(containerId);

      return {
        jobId,
        status: 'done',
        result: { containerId },
      };
    } catch (error) {
      logger.error(`Container stop failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async restart(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const containerId = params.containerId as string;
      await this.docker.restartContainer(containerId);

      return {
        jobId,
        status: 'done',
        result: { containerId },
      };
    } catch (error) {
      logger.error(`Container restart failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async delete(jobId: string, params: Record<string, unknown>): Promise<JobResult> {
    try {
      const containerId = params.containerId as string;
      const force = params.force as boolean | undefined;
      await this.docker.removeContainer(containerId, force);

      return {
        jobId,
        status: 'done',
        result: { containerId },
      };
    } catch (error) {
      logger.error(`Container delete failed: ${(error as Error).message}`);
      return {
        jobId,
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}
