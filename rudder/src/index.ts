import { RudderClient } from './client/socketClient.js';
import { DockerClient } from './docker/client.js';
import { JobHandler } from './jobs/jobHandler.js';
import { HeartbeatManager } from './health/heartbeat.js';
import { setupWheelEventHandlers } from './handlers/wheelEvents.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  logger.info(`Starting Rudder: ${config.rudderId}`);
  logger.info(`Hostname: ${config.hostname}`);
  logger.info(`Wheel URL: ${config.wheelUrl}`);

  // Initialize clients
  const client = new RudderClient();
  const docker = new DockerClient();
  const jobHandler = new JobHandler(docker);
  const heartbeat = new HeartbeatManager(client);

  // Verify Docker connection
  try {
    const dockerInfo = await docker.getInfo();
    logger.info(`Docker connected: v${dockerInfo.dockerVersion}`, {
      containers: dockerInfo.containers,
      images: dockerInfo.images,
    });
  } catch (error) {
    logger.error('Failed to connect to Docker socket', { error: (error as Error).message });
    logger.error('Make sure Docker is running and the socket is accessible');
    process.exit(1);
  }

  // Connect to Wheel
  try {
    await client.connect(docker);
  } catch (error) {
    logger.error('Failed to connect to Wheel', { error: (error as Error).message });
    // Don't exit, let reconnection logic handle it
  }

  // Setup event handlers
  setupWheelEventHandlers(client, jobHandler, docker);

  // Start heartbeat
  heartbeat.start();

  // Graceful shutdown handlers
  const shutdown = (): void => {
    logger.info('Shutting down gracefully...');
    heartbeat.stop();
    client.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Keep process alive
  logger.info('Rudder is running');
}

main().catch((error) => {
  logger.error('Fatal error', { error: (error as Error).message, stack: (error as Error).stack });
  process.exit(1);
});
