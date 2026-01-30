export interface Rudder {
  id: string;
  hostname: string;
  status: 'online' | 'offline';
  dockerVersion: string;
  lastHeartbeat: Date | string;
  createdAt: Date | string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'exited';
  rudderId: string;
  ports: Record<string, number>;
  mounts: Array<{ source: string; destination: string }>;
  env: Record<string, string>;
  createdAt: Date | string;
  startedAt?: Date | string;
}

export interface Image {
  id: string;
  repo: string;
  tag: string;
  size: number;
  createdAt: Date | string;
  usedByContainers: number;
  rudderId: string;
}

export interface Volume {
  id: string;
  name: string;
  driver: string;
  mountPoint: string;
  usedByContainers: number;
  rudderId: string;
  createdAt: Date | string;
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  rudderId: string;
  action: string;
  status: JobStatus;
  params: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
}

export interface User {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  rudderId: string;
  action: string;
  status: 'success' | 'failed';
  result: Record<string, unknown>;
  createdAt: Date | string;
}
