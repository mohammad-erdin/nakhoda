import express, { type Express } from 'express';
import path from 'path';
import routes from './routes/index.js';
import {
  // corsMiddleware,
  // loggingMiddleware,
  // rateLimitMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/index.js';

const app: Express = express();

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
// app.use(corsMiddleware);
// app.use(loggingMiddleware);
// app.use('/api', rateLimitMiddleware);
app.use(errorMiddleware);


// Health check endpoint
app.get('/health', (_req, res) => res.send('ok')); 

// for api routes
app.use('/api', routes);
app.use('/api', notFoundMiddleware);

// Serve frontend for non-API routes
const staticPath = path.join(process.cwd(), 'public');
app.use(express.static(staticPath, { index: false }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'), (err: any) => {
    if (err) {
      res.status(err?.status || 500).end();
    }
  });
});
export default app;
