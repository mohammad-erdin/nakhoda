import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  rudderId: string;
  message: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: 'rudder',
    rudderId: config.rudderId,
    message,
    ...meta,
  };
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const minLevel = config.logLevel as LogLevel;
  return levels.indexOf(level) >= levels.indexOf(minLevel);
}

function output(entry: LogEntry): void {
  const color = {
    debug: '\x1b[36m',
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
  }[entry.level];
  const reset = '\x1b[0m';
  console.log(`${color}[${entry.level.toUpperCase()}]${reset} [${entry.rudderId}] ${entry.message}`, 
    Object.keys(entry).length > 5 ? entry : '');
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      output(formatLog('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      output(formatLog('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      output(formatLog('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      output(formatLog('error', message, meta));
    }
  },
};
