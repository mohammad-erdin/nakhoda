import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis.default({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connection established');
});

redis.on('error', (err: Error) => {
  logger.error('Redis connection error', { error: err.message });
});

// Rudder session keys
const RUDDER_SESSION_PREFIX = 'rudder:';
const RUDDER_SESSION_SUFFIX = ':session';
const RUDDER_CONTAINERS_SUFFIX = ':containers';
const RUDDER_IMAGES_SUFFIX = ':images';

const SESSION_TTL = 24 * 60 * 60; // 24 hours
const CACHE_TTL = 10; // 10 seconds for container/image cache

export interface RudderSession {
  id: string;
  hostname: string;
  dockerVersion: string;
  status: 'online' | 'offline';
  socketId: string;
  lastHeartbeat: string;
  createdAt: string;
}

export async function setRudderSession(rudderId: string, session: RudderSession): Promise<void> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_SESSION_SUFFIX}`;
  await redis.set(key, JSON.stringify(session), 'EX', SESSION_TTL);
}

export async function getRudderSession(rudderId: string): Promise<RudderSession | null> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_SESSION_SUFFIX}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function updateRudderHeartbeat(rudderId: string): Promise<void> {
  const session = await getRudderSession(rudderId);
  if (session) {
    session.lastHeartbeat = new Date().toISOString();
    await setRudderSession(rudderId, session);
  }
}

export async function setRudderOffline(rudderId: string): Promise<void> {
  const session = await getRudderSession(rudderId);
  if (session) {
    session.status = 'offline';
    await setRudderSession(rudderId, session);
  }
}

export async function deleteRudderSession(rudderId: string): Promise<void> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_SESSION_SUFFIX}`;
  await redis.del(key);
}

export async function getAllRudderSessions(): Promise<RudderSession[]> {
  const sessions: RudderSession[] = [];
  const pattern = `${RUDDER_SESSION_PREFIX}*${RUDDER_SESSION_SUFFIX}`;
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      const values = await redis.mget(...keys);
      for (const data of values) {
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }
    }
  } while (cursor !== '0');

  return sessions;
}

export async function setRudderContainers(rudderId: string, containers: unknown[]): Promise<void> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_CONTAINERS_SUFFIX}`;
  await redis.set(key, JSON.stringify(containers), 'EX', CACHE_TTL);
}

export async function getRudderContainers(rudderId: string): Promise<unknown[] | null> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_CONTAINERS_SUFFIX}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setRudderImages(rudderId: string, images: unknown[]): Promise<void> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_IMAGES_SUFFIX}`;
  await redis.set(key, JSON.stringify(images), 'EX', CACHE_TTL);
}

export async function getRudderImages(rudderId: string): Promise<unknown[] | null> {
  const key = `${RUDDER_SESSION_PREFIX}${rudderId}${RUDDER_IMAGES_SUFFIX}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function testConnection(): Promise<boolean> {
  try {
    await redis.ping();
    logger.info('Redis ping successful');
    return true;
  } catch (error) {
    logger.error('Redis ping failed', { error: (error as Error).message });
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}
