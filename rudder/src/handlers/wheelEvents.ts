import { RudderClient } from '../client/socketClient.js';
import { JobHandler } from '../jobs/jobHandler.js';
import { DockerClient } from '../docker/client.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { JobPayload } from '../jobs/types.js';

export function setupWheelEventHandlers(
  client: RudderClient,
  jobHandler: JobHandler,
  docker: DockerClient
): void {
  // Handle job dispatch from Wheel
  client.on<JobPayload>('wheel:job_dispatch', async (payload) => {
    logger.info(`Received job dispatch: ${payload.action}`, { jobId: payload.job_id });

    try {
      const result = await jobHandler.executeJob(payload);
      // Convert jobId to job_id for wheel-be compatibility
      client.emit('rudder:job_complete', {
        job_id: result.jobId,
        status: result.status,
        result: result.result,
        error: result.error,
      });
    } catch (error) {
      logger.error(`Job execution error: ${(error as Error).message}`, { jobId: payload.job_id });
      client.emit('rudder:job_complete', {
        job_id: payload.job_id,
        status: 'failed',
        error: (error as Error).message,
      });
    }
  });

  // Handle ACK from Wheel
  client.on<{ timestamp: number }>('wheel:ack', (payload) => {
    logger.debug('Received ACK from Wheel', { timestamp: payload.timestamp });
  });

  // Handle request for containers list
  client.on<{ rudder_id: string }>('wheel:containers_request', async (payload) => {
    if (payload.rudder_id !== config.rudderId) return;

    try {
      const containers = await docker.listContainers();
      client.emit('rudder:containers_update', {
        rudder_id: config.rudderId,
        containers,
      });
    } catch (error) {
      logger.error(`Failed to get containers: ${(error as Error).message}`);
    }
  });

  // Handle request for images list
  client.on<{ rudder_id: string }>('wheel:images_request', async (payload) => {
    if (payload.rudder_id !== config.rudderId) return;

    try {
      const images = await docker.listImages();
      client.emit('rudder:images_update', {
        rudder_id: config.rudderId,
        images,
      });
    } catch (error) {
      logger.error(`Failed to get images: ${(error as Error).message}`);
    }
  });

  logger.info('Wheel event handlers registered');
}
