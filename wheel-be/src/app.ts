import express from 'express';
import routes from './routes/index.js';
import {
  corsMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/index.js';

const app = express();

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(loggingMiddleware);
app.use('/api', rateLimitMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
