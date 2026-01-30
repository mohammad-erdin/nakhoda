import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import * as RudderService from '../services/RudderService.js';
import * as JobService from '../services/JobService.js';
import * as cache from '../cache/index.js';

const WS_EVENTS = {
  RUDDER_REGISTER: 'rudder:register',
  RUDDER_HEARTBEAT: 'rudder:heartbeat',
  RUDDER_JOB_COMPLETE: 'rudder:job_complete',
  RUDDER_ERROR: 'rudder:error',
  RUDDER_CONTAINERS_UPDATE: 'rudder:containers_update',
  RUDDER_IMAGES_UPDATE: 'rudder:images_update',
  WHEEL_JOB_DISPATCH: 'wheel:job_dispatch',
  WHEEL_ACK: 'wheel:ack',
  BROADCAST_RUDDER_ONLINE: 'broadcast:rudder_online',
  BROADCAST_RUDDER_OFFLINE: 'broadcast:rudder_offline',
  BROADCAST_JOB_COMPLETE: 'broadcast:job_complete',
  BROADCAST_CONTAINERS_UPDATED: 'broadcast:containers_updated',
} as const;

interface RudderRegisterPayload {
  token: string;
  hostname: string;
  dockerVersion: string;
  rudderId: string;
}

interface RudderHeartbeatPayload {
  rudder_id: string;
}

interface RudderJobCompletePayload {
  job_id: string;
  status: 'done' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
}

interface ContainersUpdatePayload {
  rudder_id: string;
  containers: unknown[];
}

interface ImagesUpdatePayload {
  rudder_id: string;
  images: unknown[];
}

let io: Server | null = null;

export function createWebSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', handleConnection);

  logger.info('WebSocket server initialized');
  return io;
}

function handleConnection(socket: Socket): void {
  logger.info('New WebSocket connection', { socketId: socket.id });

  let rudderId: string | null = null;

  // Rudder registration
  socket.on(WS_EVENTS.RUDDER_REGISTER, async (payload: RudderRegisterPayload) => {
    try {
      // Validate token
      if (!config.rudderTokens.includes(payload.token)) {
        logger.warn('Invalid rudder token', { socketId: socket.id });
        socket.emit(WS_EVENTS.RUDDER_ERROR, { error: 'Invalid token' });
        socket.disconnect();
        return;
      }

      rudderId = payload.rudderId;

      // Register rudder
      await RudderService.registerRudder(
        rudderId,
        payload.hostname,
        payload.dockerVersion,
        socket.id
      );

      // Join rudder-specific room
      socket.join(`rudder:${rudderId}`);

      // Send acknowledgment
      socket.emit(WS_EVENTS.WHEEL_ACK, { timestamp: Date.now() });

      // Broadcast to FE clients
      if (io) {
        io.emit(WS_EVENTS.BROADCAST_RUDDER_ONLINE, { rudder_id: rudderId });
      }

      logger.info('Rudder registered successfully', { rudderId, hostname: payload.hostname });

      // Dispatch any pending jobs
      await dispatchPendingJobs(rudderId, socket);
    } catch (error) {
      logger.error('Rudder registration error', { error: (error as Error).message });
      socket.emit(WS_EVENTS.RUDDER_ERROR, { error: 'Registration failed' });
    }
  });

  // Heartbeat
  socket.on(WS_EVENTS.RUDDER_HEARTBEAT, async (payload: RudderHeartbeatPayload) => {
    try {
      await RudderService.updateHeartbeat(payload.rudder_id);
      socket.emit(WS_EVENTS.WHEEL_ACK, { timestamp: Date.now() });
    } catch (error) {
      logger.error('Heartbeat error', { error: (error as Error).message });
    }
  });

  // Job complete
  socket.on(WS_EVENTS.RUDDER_JOB_COMPLETE, async (payload: RudderJobCompletePayload) => {
    try {
      await JobService.updateJobStatus(
        payload.job_id,
        payload.status,
        payload.result,
        payload.error
      );

      // Broadcast to FE clients
      if (io) {
        io.emit(WS_EVENTS.BROADCAST_JOB_COMPLETE, {
          job_id: payload.job_id,
          status: payload.status,
        });
      }

      logger.info('Job completed', { jobId: payload.job_id, status: payload.status });
    } catch (error) {
      logger.error('Job complete error', { error: (error as Error).message });
    }
  });

  // Containers update from rudder
  socket.on(WS_EVENTS.RUDDER_CONTAINERS_UPDATE, async (payload: ContainersUpdatePayload) => {
    try {
      await cache.setRudderContainers(payload.rudder_id, payload.containers);

      // Broadcast to FE clients
      if (io) {
        io.emit(WS_EVENTS.BROADCAST_CONTAINERS_UPDATED, {
          rudder_id: payload.rudder_id,
          containers: payload.containers,
        });
      }
    } catch (error) {
      logger.error('Containers update error', { error: (error as Error).message });
    }
  });

  // Images update from rudder
  socket.on(WS_EVENTS.RUDDER_IMAGES_UPDATE, async (payload: ImagesUpdatePayload) => {
    try {
      await cache.setRudderImages(payload.rudder_id, payload.images);
    } catch (error) {
      logger.error('Images update error', { error: (error as Error).message });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    if (rudderId) {
      await RudderService.setRudderOffline(rudderId);

      // Broadcast to FE clients
      if (io) {
        io.emit(WS_EVENTS.BROADCAST_RUDDER_OFFLINE, { rudder_id: rudderId });
      }

      logger.info('Rudder disconnected', { rudderId });
    }
  });
}

async function dispatchPendingJobs(rudderId: string, socket: Socket): Promise<void> {
  try {
    const pendingJobs = await JobService.getPendingJobs(rudderId);

    for (const job of pendingJobs) {
      await JobService.updateJobStatus(job.id, 'running');
      
      socket.emit(WS_EVENTS.WHEEL_JOB_DISPATCH, {
        job_id: job.id,
        action: job.action,
        params: job.params,
      });

      logger.info('Job dispatched', { jobId: job.id, rudderId });
    }
  } catch (error) {
    logger.error('Error dispatching pending jobs', { error: (error as Error).message });
  }
}

export async function dispatchJob(rudderId: string, jobId: string, action: string, params: Record<string, unknown>): Promise<boolean> {
  if (!io) {
    logger.error('WebSocket server not initialized');
    return false;
  }

  const socketId = await RudderService.getRudderSocketId(rudderId);
  if (!socketId) {
    logger.warn('Rudder socket not found', { rudderId });
    return false;
  }

  const socket = io.sockets.sockets.get(socketId);
  if (!socket) {
    logger.warn('Socket not connected', { rudderId, socketId });
    return false;
  }

  socket.emit(WS_EVENTS.WHEEL_JOB_DISPATCH, {
    job_id: jobId,
    action,
    params,
  });

  await JobService.updateJobStatus(jobId, 'running');
  logger.info('Job dispatched', { jobId, rudderId, action });

  return true;
}

export function getIO(): Server | null {
  return io;
}
