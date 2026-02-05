import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function loggingMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const start = Date.now();

	res.on('finish', () => {
		const duration = Date.now() - start;
		logger.info('HTTP Request', {
			method: req.method,
			path: req.path,
			statusCode: res.statusCode,
			duration,
			userAgent: req.headers['user-agent'],
			ip: req.ip,
		});
	});

	next();
}
