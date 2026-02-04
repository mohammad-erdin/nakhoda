import express, { type Express } from 'express';
import path from 'path';
import routes from './routes/index.js';
import {
  corsMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/index.js';

const app: Express = express();

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
// Serve static frontend in production (serve assets only)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(staticPath, { index: false }));
}

app.use('/api', routes);

// SPA fallback for client-side routing - only in production (must come after API routes)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(process.cwd(), 'dist', 'public');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'), (err: any) => {
      if (err) {
        res.status(err?.status || 500).end();
      }
    });
  });
}

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
