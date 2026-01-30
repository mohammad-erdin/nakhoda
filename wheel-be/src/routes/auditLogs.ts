import { Router, Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { paginationSchema } from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

const auditLogFilterSchema = z.object({
  rudder_id: z.string().optional(),
  status: z.enum(['success', 'failed']).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

// List audit logs
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = auditLogFilterSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const result = await AuditLogService.listAuditLogs({
      rudderId: filters.rudder_id,
      status: filters.status,
      days: filters.days,
      page: pagination.page,
      limit: pagination.limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
