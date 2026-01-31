import { RudderClient } from '../client/socketClient.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class HeartbeatManager {
  private client: RudderClient;
  private interval: NodeJS.Timeout | null = null;
  private lastAckTime = Date.now();

  constructor(client: RudderClient) {
    this.client = client;
  }

  start(): void {
    logger.info('Starting heartbeat manager', { interval: config.heartbeatInterval });

    // Listen for ACKs
    this.client.on<{ timestamp: number }>('wheel:ack', (payload) => {
      logger.debug('Received ACK from Wheel', { timestamp: payload.timestamp });
      this.lastAckTime = Date.now();
    });

    // Start heartbeat interval
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, config.heartbeatInterval);

    // Send initial heartbeat
    this.sendHeartbeat();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Heartbeat manager stopped');
    }
  }

  updateAckTime(): void {
    this.lastAckTime = Date.now();
  }

  private sendHeartbeat(): void {
    if (!this.client.isConnected()) {
      logger.debug('Skipping heartbeat: not connected');
      return;
    }

    // Check if we got ACK recently
    const timeSinceAck = Date.now() - this.lastAckTime;
    if (timeSinceAck > config.offlineThreshold) {
      logger.warn(`No ACK from Wheel for ${timeSinceAck}ms, connection may be stale`);
    }

    logger.debug('Sending heartbeat');
    this.client.emit('rudder:heartbeat', { rudder_id: config.rudderId });
  }
}
