import { logger } from '../utils/logger.js';
import type { JobPayload } from '../jobs/types.js';

export class LocalQueue {
  private queue: JobPayload[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  enqueue(job: JobPayload): boolean {
    if (this.queue.length >= this.maxSize) {
      logger.warn('Local queue full, discarding oldest job');
      this.queue.shift();
    }
    this.queue.push(job);
    logger.debug(`Job queued locally: ${job.job_id}`, { queueSize: this.queue.length });
    return true;
  }

  dequeue(): JobPayload | undefined {
    return this.queue.shift();
  }

  dequeueAll(): JobPayload[] {
    const jobs = [...this.queue];
    this.queue = [];
    logger.info(`Dequeued ${jobs.length} jobs from local queue`);
    return jobs;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }
}
