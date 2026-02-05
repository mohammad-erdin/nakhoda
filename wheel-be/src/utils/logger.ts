import { config } from '../config/index.js';

export type LogFormat = 'string' | 'json' | 'detailed';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
	return {
		timestamp: new Date().toISOString(),
		level,
		service: 'wheel-be',
		message,
		...meta,
	};
}

function shouldLog(level: LogLevel): boolean {
	const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
	const minLevel = config.nodeEnv === 'development' ? 'debug' : 'info';
	return levels.indexOf(level) >= levels.indexOf(minLevel);
}

function output(entry: LogEntry): void {
	const format = (config as any).logFormat as LogFormat | undefined;
	const effectiveFormat: LogFormat = format || 'string';
	switch (effectiveFormat) {
		case 'json':
			console.log(JSON.stringify(entry));
			break;
		case 'string': {
			const color = {
				debug: '\x1b[36m',
				info: '\x1b[32m',
				warn: '\x1b[33m',
				error: '\x1b[31m',
			}[entry.level];
			const reset = '\x1b[0m';
			console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}. ${entry.text ?? ''}`);
			break;
		}
		case 'detailed':
			console.info(entry);
			break;
	}
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
