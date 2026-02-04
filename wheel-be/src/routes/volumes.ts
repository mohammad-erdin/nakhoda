import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { VolumeService, AuditLogService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { createVolumeSchema, paginationSchema } from '../utils/validation.js';
import { BadRequestError } from '../utils/errors.js';

const router: RouterType = Router();

// List all volumes
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    // rudderId and driver are available for future filtering implementation

    // For now, return empty list since volumes are cached per-rudder
    // In a real implementation, this would aggregate from all rudders
    const items: unknown[] = [];
    const total = 0;

    res.json({
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: 0,
    });
  } catch (error) {
    next(error);
  }
});

// Create volume
router.post('/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createVolumeSchema.parse(req.body);
    const result = await VolumeService.createVolume({
      rudderId: input.rudder_id,
      name: input.name,
      driver: input.driver,
      labels: input.labels,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId: input.rudder_id,
      action: 'volume.create',
      status: 'success',
      params: { name: input.name, driver: input.driver },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete volume
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudderId = req.query.rudder_id as string | undefined;
    if (!rudderId) {
      throw new BadRequestError('rudder_id query parameter is required');
    }

    const force = req.query.force === 'true';
    const volumeId = req.params.id as string;

    const result = await VolumeService.deleteVolume({
      rudderId,
      volumeId,
      force,
    });

    await AuditLogService.createAuditLog({
      userId: req.user?.userId,
      rudderId,
      action: 'volume.delete',
      status: 'success',
      params: { volumeId, force },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
