import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  wheelUrl: getEnv('WHEEL_URL', 'ws://localhost:8080'),
  rudderId: requireEnv('RUDDER_ID'),
  token: requireEnv('RUDDER_TOKEN'),
  hostname: getEnv('RUDDER_HOSTNAME', os.hostname()),
  heartbeatInterval: getEnvNumber('HEARTBEAT_INTERVAL_MS', 30000),
  reconnectMaxDelay: getEnvNumber('RECONNECT_MAX_DELAY_MS', 60000),
  offlineThreshold: getEnvNumber('RUDDER_OFFLINE_THRESHOLD_MS', 90000),
  logLevel: getEnv('LOG_LEVEL', 'info'),
} as const;

export type Config = typeof config;
