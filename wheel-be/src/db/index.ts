import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
	host: config.db.host,
	port: config.db.port,
	user: config.db.user,
	password: config.db.password,
	database: config.db.database,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
	logger.error('Unexpected database pool error', { error: err.message });
});

// Guard to ensure we only end the pool once
let poolClosed = false;

export async function query<T extends pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
	const start = Date.now();
	try {
		const result = await pool.query<T>(text, params);
		const duration = Date.now() - start;
		logger.debug('Database query executed', { text, duration, rows: result.rowCount });
		return result;
	} catch (error) {
		logger.error('Database query error', { text, error: (error as Error).message });
		throw error;
	}
} 

export async function getClient(): Promise<pg.PoolClient> {
	const client = await pool.connect();
	return client;
}

export async function transaction<T>(
	callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await callback(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

export async function testConnection(): Promise<boolean> {
	try {
		await pool.query('SELECT NOW()');
		logger.info('Database connection established');
		return true;
	} catch (error) {
		logger.error('Database connection failed', { error: (error as Error).message });
		return false;
	}
}

export async function closePool(): Promise<void> {
	if (poolClosed) {
		logger.info('Database pool already closed');
		return;
	}
	poolClosed = true;
	try {
		await pool.end();
		logger.info('Database pool closed');
	} catch (error) {
		logger.error('Error closing database pool', { error: (error as Error).message });
	}
} 
