import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { AuthService } from '../services/index.js';
import { loginSchema } from '../utils/validation.js';

const router: RouterType = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await AuthService.login(input.username, input.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
