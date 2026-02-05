import { query } from '../index.js';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  name: string | null;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export async function findByUsername(username: string): Promise<UserRow | null> {
	const result = await query<UserRow>(
		'SELECT * FROM users WHERE username = $1',
		[username]
	);
	return result.rows[0] || null;
}

export async function findById(id: string): Promise<UserRow | null> {
	const result = await query<UserRow>(
		'SELECT * FROM users WHERE id = $1',
		[id]
	);
	return result.rows[0] || null;
}

export async function updateLastLogin(id: string): Promise<void> {
	await query(
		'UPDATE users SET updated_at = NOW() WHERE id = $1',
		[id]
	);
}
