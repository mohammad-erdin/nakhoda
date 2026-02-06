import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string, devDefault?: string): string {
	const value = process.env[key];
	if (!value) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error(`Missing required environment variable: ${key}`);
		}
		return devDefault || '';
	}
	return value;
}

function getEnv(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
	const value = process.env[key];
	return value ? parseInt(value, 10) : defaultValue;
}

export const config = {
	nodeEnv: getEnv('NODE_ENV', 'development'),
	port: getEnvNumber('BE_PORT', 3000),
	wsPort: getEnvNumber('FE_WS_PORT', 8080),
	db: {
		host: getEnv('DB_HOST', 'localhost'),
		port: getEnvNumber('DB_PORT', 5432),
		user: getEnv('DB_USER', 'nakhoda'),
		password: getEnv('DB_PASSWORD', 'nakhoda'),
		database: getEnv('DB_NAME', 'nakhoda'),
	},

	redis: {
		host: getEnv('REDIS_HOST', 'localhost'),
		port: getEnvNumber('REDIS_PORT', 6379),
	},

	jwt: {
		secret: requireEnv('JWT_SECRET', ''),
		expiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
	},

	rudderTokens: getEnv('RUDDER_TOKENS', '').split(',').filter(Boolean),

	job: {
		retentionDays: getEnvNumber('JOB_RETENTION_DAYS', 30),
		timeoutMs: getEnvNumber('JOB_TIMEOUT_MS', 300000),
	},

	rateLimit: {
		windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
		max: getEnvNumber('RATE_LIMIT_MAX', 100),
	},
} as const;

export type Config = typeof config;
