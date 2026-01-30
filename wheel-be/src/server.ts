import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { testConnection as testDbConnection, closePool } from './db/index.js';
import { testConnection as testRedisConnection, closeConnection as closeRedis } from './cache/index.js';
import { createWebSocketServer } from './websocket/index.js';
import { startCleanupScheduler, stopCleanupScheduler } from './jobs/cleanup.js';

async function startServer(): Promise<void> {
  logger.info('Starting Wheel BE server...');

  // Test database connection
  const dbConnected = await testDbConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Server will start but some features may not work.');
  }

  // Test Redis connection
  const redisConnected = await testRedisConnection();
  if (!redisConnected) {
    logger.error('Failed to connect to Redis. Server will start but some features may not work.');
  }

  // Create HTTP server
  const server = http.createServer(app);

  // Create WebSocket server
  createWebSocketServer(server);

  // Start cleanup scheduler
  startCleanupScheduler();

  // Start server
  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, {
      nodeEnv: config.nodeEnv,
      port: config.port,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down gracefully...`);

    stopCleanupScheduler();

    server.close(async () => {
      logger.info('HTTP server closed');
      await closePool();
      await closeRedis();
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
