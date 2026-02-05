import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export function errorMiddleware(
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction
): void {
	logger.error('Request error', {
		error: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
	});

	// Handle Zod validation errors
	if (err instanceof ZodError) {
		const response: ErrorResponse = {
			error: 'Validation error',
			code: 'VALIDATION_ERROR',
			details: {
				issues: err.errors.map((e) => ({
					field: e.path.join('.'),
					message: e.message,
				})),
			},
		};
		res.status(400).json(response);
		return;
	}

	// Handle custom application errors
	if (err instanceof AppError) {
		const response: ErrorResponse = {
			error: err.message,
			code: err.code,
		};
		res.status(err.statusCode).json(response);
		return;
	}

	// Handle unknown errors
	const response: ErrorResponse = {
		error: 'Internal server error',
		code: 'INTERNAL_ERROR',
	};

	// Only include stack trace in development
	if (process.env.NODE_ENV === 'development') {
		response.details = { stack: err.stack };
	}

	res.status(500).json(response);
}

export function notFoundMiddleware(
	req: Request,
	res: Response,
	_next: NextFunction
): void {
	const response: ErrorResponse = {
		error: `Route ${req.method} ${req.path} not found`,
		code: 'ROUTE_NOT_FOUND',
	};
	res.status(404).json(response);
}
