import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
	const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
	const minLevel = config.nodeEnv === 'development' ? 'debug' : 'info';
	if (levels.indexOf(level) < levels.indexOf(minLevel)) return;

	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...meta,
	};
	const color = {
		debug: '\x1b[36m',
		info: '\x1b[32m',
		warn: '\x1b[33m',
		error: '\x1b[31m',
	}[entry.level];
	
	const yellow = '\x1b[33m';
	const reset = '\x1b[0m';
	const detail = meta && Object.keys(meta).length
		? JSON.stringify(meta)
			.replace(/\\n+/g, ' ')
			.replace(/\s{2,}/g, ' ')
			.trim()
		: '';
	console.log(`${color}[${entry.level.toUpperCase()}]${reset}\t - [${entry.timestamp}] ${entry.message} ${yellow}${detail}${reset}`);
} 

export const logger = {
	debug: (message: string, meta?: Record<string, unknown>) => writeLog('debug', message, meta),
	info: (message: string, meta?: Record<string, unknown>) => writeLog('info', message, meta),
	warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', message, meta),
	error: (message: string, meta?: Record<string, unknown>) => writeLog('error', message, meta),
};
