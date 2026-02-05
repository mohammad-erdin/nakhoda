import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { closePool, testConnection as testDbConnection } from './db/index.js';
import { closeRedis, testConnection as testRedisConnection } from './cache/index.js';
import { startCleanupScheduler, stopCleanupScheduler } from './jobs/cleanup.js';

async function startServer(): Promise<void> {
	logger.debug('Starting Wheel BE server...');

	// Test database connection
	await testDbConnection();
	await testRedisConnection();

	startCleanupScheduler();

	const server = http.createServer(app);
	server.listen(config.port, () => {
		logger.info(`Server running on port ${config.port}`, {
			nodeEnv: config.nodeEnv,
			port: config.port,
		});
	});

	// Graceful shutdown
	let isShuttingDown = false;
	const shutdown = async (signal: string): Promise<void> => {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		logger.info(`\r${signal} received, shutting down gracefully...`);

		stopCleanupScheduler();

		server.close(async () => {
			logger.info('HTTP server closed');
			try {
				await closePool();
				await closeRedis();
			} catch (error) {
				logger.error('Error during shutdown', { error: (error as Error).message });
			} finally {
				process.exit(0);
			}
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
	process.exit(0);
});