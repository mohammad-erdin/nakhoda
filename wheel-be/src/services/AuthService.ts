import bcrypt from 'bcrypt';
import * as userQueries from '../db/queries/users.js';
import { generateToken } from '../middleware/auth.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface LoginResult {
  sessionToken: string;
  user: {
    id: string;
    name: string;
  };
}

export async function login(username: string, password: string): Promise<LoginResult> {
	const user = await userQueries.findByUsername(username);
  
	if (!user) {
		logger.warn('Login attempt for non-existent user', { username });
		throw new UnauthorizedError('Invalid username or password');
	}

	const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
	if (!passwordMatch) {
		logger.warn('Invalid password attempt', { username });
		throw new UnauthorizedError('Invalid username or password');
	}

	await userQueries.updateLastLogin(user.id);

	const token = generateToken({
		userId: user.id,
		username: user.username,
		role: user.role,
	});

	logger.info('User logged in', { userId: user.id, username: user.username });

	return {
		sessionToken: token,
		user: {
			id: user.id,
			name: user.name || user.username,
		},
	};
}

export async function getUserById(userId: string): Promise<{ id: string; name: string } | null> {
	const user = await userQueries.findById(userId);
	if (!user) return null;
  
	return {
		id: user.id,
		name: user.name || user.username,
	};
}
