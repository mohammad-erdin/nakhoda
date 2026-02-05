import * as cache from '../cache/index.js';
import { logger } from '../utils/logger.js';
import { RudderNotFoundError, RudderOfflineError } from '../utils/errors.js';

export interface Rudder {
  id: string;
  hostname: string;
  status: 'online' | 'offline';
  dockerVersion: string;
  lastHeartbeat: string;
  createdAt: string;
  socketId?: string;
}

export interface RudderHealth {
  status: 'online' | 'offline';
  uptime: number;
  dockerVersion: string;
  lastHeartbeat: string;
}

export async function getRudders(status?: 'online' | 'offline'): Promise<Rudder[]> {
	const sessions = await cache.getAllRudderSessions();
	let rudders: Rudder[] = sessions.map((session) => ({
		id: session.id,
		hostname: session.hostname,
		status: session.status,
		dockerVersion: session.dockerVersion,
		lastHeartbeat: session.lastHeartbeat,
		createdAt: session.createdAt,
	}));

	if (status) {
		rudders = rudders.filter((r) => r.status === status);
	}

	return rudders;
}

export async function getRudder(rudderId: string): Promise<Rudder> {
	const session = await cache.getRudderSession(rudderId);
	if (!session) {
		throw new RudderNotFoundError(rudderId);
	}

	return {
		id: session.id,
		hostname: session.hostname,
		status: session.status,
		dockerVersion: session.dockerVersion,
		lastHeartbeat: session.lastHeartbeat,
		createdAt: session.createdAt,
	};
}

export async function getRudderHealth(rudderId: string): Promise<RudderHealth> {
	const session = await cache.getRudderSession(rudderId);
	if (!session) {
		throw new RudderNotFoundError(rudderId);
	}

	const createdAt = new Date(session.createdAt).getTime();
	const now = Date.now();
	const uptime = Math.floor((now - createdAt) / 1000);

	return {
		status: session.status,
		uptime,
		dockerVersion: session.dockerVersion,
		lastHeartbeat: session.lastHeartbeat,
	};
}

export async function registerRudder(
	rudderId: string,
	hostname: string,
	dockerVersion: string,
	socketId: string
): Promise<Rudder> {
	const now = new Date().toISOString();
	const session: cache.RudderSession = {
		id: rudderId,
		hostname,
		dockerVersion,
		status: 'online',
		socketId,
		lastHeartbeat: now,
		createdAt: now,
	};

	await cache.setRudderSession(rudderId, session);
	logger.info('Rudder registered', { rudderId, hostname });

	return {
		id: session.id,
		hostname: session.hostname,
		status: session.status,
		dockerVersion: session.dockerVersion,
		lastHeartbeat: session.lastHeartbeat,
		createdAt: session.createdAt,
	};
}

export async function updateHeartbeat(rudderId: string): Promise<void> {
	await cache.updateRudderHeartbeat(rudderId);
	logger.debug('Rudder heartbeat updated', { rudderId });
}

export async function setRudderOffline(rudderId: string): Promise<void> {
	await cache.setRudderOffline(rudderId);
	logger.info('Rudder set offline', { rudderId });
}

export async function removeRudder(rudderId: string): Promise<void> {
	await cache.deleteRudderSession(rudderId);
	logger.info('Rudder removed', { rudderId });
}

export async function ensureRudderOnline(rudderId: string): Promise<cache.RudderSession> {
	const session = await cache.getRudderSession(rudderId);
	if (!session) {
		throw new RudderNotFoundError(rudderId);
	}
	if (session.status !== 'online') {
		throw new RudderOfflineError(rudderId);
	}
	return session;
}

export async function getRudderSocketId(rudderId: string): Promise<string | null> {
	const session = await cache.getRudderSession(rudderId);
	return session?.socketId || null;
}
