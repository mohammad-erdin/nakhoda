import express, { type Express } from 'express';
import path from 'path';
import routes from './routes/index.js';
import {
	// corsMiddleware,
	loggingMiddleware,
	// rateLimitMiddleware,
	errorMiddleware,
	notFoundMiddleware,
} from './middleware/index.js';

const app: Express = express();

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/api', rateLimitMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => res.send('ok')); 

// for api routes
app.use('/api', routes);
app.use('/api', notFoundMiddleware);

// Serve frontend for non-API routes
const staticPath = path.join(process.cwd(), 'public');
app.use(express.static(staticPath, { index: false }));
// Use a regex catch-all as the fallback route to avoid path-to-regexp parsing issues
app.get(/.*/, (_req, res) => {
	res.sendFile(path.join(staticPath, 'index.html'), (err: any) => {
		if (err) {
			res.status(err?.status || 500).end();
		}
	});
});

// need to be the last middleware
app.use(errorMiddleware);
app.use(loggingMiddleware);
export default app;
