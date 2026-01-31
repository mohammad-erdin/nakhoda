import { JobService } from '../services/index.js';
import { logger } from '../utils/logger.js';

const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

let cleanupTimer: NodeJS.Timeout | null = null;

export function startCleanupScheduler(): void {
  // Run initial cleanup
  runCleanup();

  // Schedule periodic cleanup
  cleanupTimer = setInterval(runCleanup, CLEANUP_INTERVAL);

  logger.info('Job cleanup scheduler started', { intervalHours: CLEANUP_INTERVAL / 1000 / 60 / 60 });
}

export function stopCleanupScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    logger.info('Job cleanup scheduler stopped');
  }
}

async function runCleanup(): Promise<void> {
  try {
    const deleted = await JobService.cleanupOldJobs();
    if (deleted > 0) {
      logger.info('Job cleanup completed', { deletedCount: deleted });
    }
  } catch (error) {
    logger.error('Job cleanup failed', { error: (error as Error).message });
  }
}
