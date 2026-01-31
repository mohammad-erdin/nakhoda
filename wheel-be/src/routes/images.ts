import { Router, Request, Response, NextFunction } from 'express';
import { ImageService, AuditLogService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { pullImageSchema, paginationSchema } from '../utils/validation.js';
import * as cache from '../cache/index.js';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

// List all images
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const rudderId = req.query.rudder_id as string | undefined;
    const repo = req.query.repo as string | undefined;

    // Get images from all rudders cache
    const sessions = await cache.getAllRudderSessions();
    const allImages: unknown[] = [];

    for (const session of sessions) {
      if (rudderId && session.id !== rudderId) continue;

      const images = await cache.getRudderImages(session.id);
      if (images) {
        allImages.push(...images);
      }
    }

    // Apply filters
    let filtered = allImages as Array<{ repo?: string }>;

    if (repo) {
      filtered = filtered.filter((img) => img.repo?.includes(repo));
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

// Pull image
router.post('/pull', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = pullImageSchema.parse(req.body);
    const result = await ImageService.pullImage({
      rudderId: input.rudder_id,
      repo: input.repo,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId: input.rudder_id,
      action: 'image.pull',
      status: 'success',
      params: { repo: input.repo },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete image
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.query.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id query parameter is required');
    }

    const force = req.query.force === 'true';
    const imageId = req.params.id as string;

    const result = await ImageService.deleteImage({
      rudderId,
      imageId,
      force,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'image.delete',
      status: 'success',
      params: { imageId, force },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
