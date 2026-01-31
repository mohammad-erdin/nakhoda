import { io, Socket } from 'socket.io-client';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { DockerClient } from '../docker/client.js';

export class RudderClient {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay: number;

  constructor() {
    this.maxReconnectDelay = config.reconnectMaxDelay;
  }

  async connect(docker: DockerClient): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Connecting to Wheel: ${config.wheelUrl}`);

      this.socket = io(config.wheelUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: this.maxReconnectDelay,
        query: {
          rudder_id: config.rudderId,
        },
      });

      this.socket.on('connect', async () => {
        logger.info('Connected to Wheel');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Get Docker info for registration
        try {
          const dockerInfo = await docker.getInfo();
          
          // Register with Wheel
          this.emit('rudder:register', {
            token: config.token,
            hostname: config.hostname,
            dockerVersion: dockerInfo.dockerVersion,
            rudderId: config.rudderId,
          });

          resolve();
        } catch (error) {
          logger.error('Failed to get Docker info', { error: (error as Error).message });
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn(`Disconnected from Wheel: ${reason}`);
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
        logger.error(`Connection error (attempt ${this.reconnectAttempts}): ${error.message}`);
        
        if (this.reconnectAttempts === 1) {
          // Only reject on first connection attempt failure
          // Let reconnection logic handle subsequent attempts
        }
      });

      this.socket.on('rudder:error', (payload: { error: string }) => {
        logger.error(`Rudder error from Wheel: ${payload.error}`);
        if (payload.error === 'Invalid token') {
          logger.error('Invalid token, exiting...');
          process.exit(1);
        }
      });

      // Set a connection timeout
      setTimeout(() => {
        if (!this.connected) {
          logger.warn('Connection timeout, will keep trying to reconnect...');
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      logger.info('Disconnecting from Wheel');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on<T>(event: string, handler: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data: unknown): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      logger.warn(`Cannot emit ${event}: not connected`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}
