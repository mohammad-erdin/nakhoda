import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { settingsUpdateSchema } from '../utils/validation.js';
import { config } from '../config/index.js';

const router = Router();

// In-memory settings storage (in production, this would be in the database)
const userSettings: Map<string, { jobRetentionDays: number; theme: 'light' | 'dark'; language: string }> = new Map();

// Get settings
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const settings = userSettings.get(userId || '') || {
      jobRetentionDays: config.job.retentionDays,
      theme: 'light' as const,
      language: 'en',
    };

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update settings
router.patch('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updates = settingsUpdateSchema.parse(req.body);
    const currentSettings = userSettings.get(userId) || {
      jobRetentionDays: config.job.retentionDays,
      theme: 'light' as const,
      language: 'en',
    };

    const newSettings = {
      ...currentSettings,
      ...updates,
    };

    userSettings.set(userId, newSettings);

    res.json(newSettings);
  } catch (error) {
    next(error);
  }
});

export default router;
