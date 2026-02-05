import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { JobService } from '../services/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { jobFilterSchema, paginationSchema } from '../utils/validation.js';

const router: RouterType = Router();

// List all jobs
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const filters = jobFilterSchema.parse(req.query);
		const pagination = paginationSchema.parse(req.query);

		const result = await JobService.listJobs({
			status: filters.status,
			rudderId: filters.rudder_id,
			days: filters.days,
			page: pagination.page,
			limit: pagination.limit,
		});

		res.json(result);
	} catch (error) {
		next(error);
	}
});

// Get job details with logs
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const job = await JobService.getJobWithLogs(req.params.id as string);
		res.json(job);
	} catch (error) {
		next(error);
	}
});

// Retry job
router.post('/:id/retry', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const originalJob = await JobService.getJob(req.params.id as string);
    
		// Create a new job with the same parameters
		const newJob = await JobService.createJob({
			rudderId: originalJob.rudderId,
			action: originalJob.action,
			params: originalJob.params,
		});

		res.json({
			originalJobId: originalJob.id,
			newJobId: newJob.id,
			status: newJob.status,
		});
	} catch (error) {
		next(error);
	}
});

export default router;
