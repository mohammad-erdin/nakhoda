import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { RudderService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router: RouterType = Router();

// List all rudders
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as 'online' | 'offline' | undefined;
    const rudders = await RudderService.getRudders(status);
    res.json(rudders);
  } catch (error) {
    next(error);
  }
});

// Get single rudder
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rudder = await RudderService.getRudder(req.params.id as string);
    res.json(rudder);
  } catch (error) {
    next(error);
  }
});

// Get rudder health
router.get('/:id/health', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await RudderService.getRudderHealth(req.params.id as string);
    res.json(health);
  } catch (error) {
    next(error);
  }
});

export default router;
