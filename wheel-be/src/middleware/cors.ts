import cors from 'cors';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
logger.info('CORS allowed origins', { origins: allowedOrigins });

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    logger.debug('CORS origin check', { origin, allowedOrigins });
    // allow non-browser clients (no origin header)
    if (!origin) {
      logger.debug('CORS: no origin header (non-browser client) - allowing');
      return callback(null, true);
    }
    // allow wildcard
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      logger.debug('CORS: origin allowed', { origin });
      return callback(null, true);
    }
    logger.warn('CORS: origin rejected', { origin });
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  
});
