import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { ContainerService, AuditLogService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { createContainerSchema, containerFilterSchema, paginationSchema } from '../utils/validation.js';
import * as cache from '../cache/index.js';
import { BadRequestError } from '../utils/errors.js';
import { getIO } from '../websocket/index.js';

const router: RouterType = Router();

// Helper: ask a rudder for its containers and wait briefly for cache to populate
async function requestContainersFromRudder(rudderId: string, timeout = 2000): Promise<unknown[] | null> {
  // If there is already containers in cache, return immediately
  const existing = await cache.getRudderContainers(rudderId);
  if (existing) return existing;

  // Emit request to specific rudder socket
  const io = getIO();
  if (!io) return null;

  // Find socket id from session
  const session = await cache.getRudderSession(rudderId);
  const socketId = session?.socketId;
  if (!socketId) return null;

  try {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) return null;

    socket.emit('wheel:containers_request', { rudder_id: rudderId });

    // Poll cache for up to timeout ms
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const data = await cache.getRudderContainers(rudderId);
      if (data) return data;
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (err) {
    // ignore
  }

  return null;
}

// List all containers
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = containerFilterSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    // Get containers from all rudders cache
    const sessions = await cache.getAllRudderSessions();
    const allContainers: unknown[] = [];

    for (const session of sessions) {
      if (filters.rudder_id && session.id !== filters.rudder_id) continue;

      // try to read from cache first
      let containers = await cache.getRudderContainers(session.id);

      // if cache missing and rudder is online, request containers and wait briefly
      if (!containers && session.status === 'online') {
        const data = await requestContainersFromRudder(session.id, 2000);
        if (data) containers = data;
      }

      if (containers) {
        // append rudder id to each container
        containers = (containers as Array<{ [key: string]: unknown }>).map((c) => ({
          ...c,
          rudderId: session.id,
        }));
        allContainers.push(...containers);
      }
    }

    // Apply filters and pagination
    let filtered = allContainers as Array<{ status?: string; image?: string }>;
    
    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    if (filters.image) {
      filtered = filtered.filter((c) => c.image?.includes(filters.image || ''));
    }

    const total = filtered.length;
    const start = (pagination.page - 1) * pagination.limit;
    const items = filtered.slice(start, start + pagination.limit);

    res.json({
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    });
  } catch (error) {
    next(error);
  }
});

// Create container
router.post('/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createContainerSchema.parse(req.body);
    const result = await ContainerService.createContainer({
      rudderId: input.rudder_id,
      image: input.image,
      name: input.name,
      ports: input.ports,
      env: input.env,
      mounts: input.mounts,
      cmd: input.cmd,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId: input.rudder_id,
      action: 'container.create',
      status: 'success',
      params: { image: input.image, name: input.name },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Start container
router.post('/:id/start', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.body.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id is required');
    }

    const result = await ContainerService.startContainer({
      containerId: req.params.id as string,
      rudderId,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'container.start',
      status: 'success',
      params: { containerId: req.params.id },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Stop container
router.post('/:id/stop', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.body.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id is required');
    }

    const result = await ContainerService.stopContainer({
      containerId: req.params.id as string,
      rudderId,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'container.stop',
      status: 'success',
      params: { containerId: req.params.id },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Restart container
router.post('/:id/restart', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.body.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id is required');
    }

    const result = await ContainerService.restartContainer({
      containerId: req.params.id as string,
      rudderId,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'container.restart',
      status: 'success',
      params: { containerId: req.params.id },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete container
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.query.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id query parameter is required');
    }

    const force = req.query.force === 'true';
    const containerId = req.params.id as string;

    const result = await ContainerService.deleteContainer({
      containerId,
      rudderId,
      force,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'container.delete',
      status: 'success',
      params: { containerId, force },
      ipAddress: req.ip,
    });

    res.json({ ...result, message: 'Container deletion queued' });
  } catch (error) {
    next(error);
  }
});

export default router;
