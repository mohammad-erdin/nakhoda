import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createContainerSchema = z.object({
  rudder_id: z.string().min(1, 'Rudder ID is required'),
  image: z.string().min(1, 'Image is required'),
  name: z.string().min(1, 'Container name is required').regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, 'Invalid container name'),
  ports: z.record(z.number()).optional(),
  env: z.record(z.string()).optional(),
  mounts: z.array(z.object({
    source: z.string(),
    destination: z.string(),
  })).optional(),
  cmd: z.array(z.string()).optional(),
});

export const pullImageSchema = z.object({
  rudder_id: z.string().min(1, 'Rudder ID is required'),
  repo: z.string().min(1, 'Repository is required'),
});

export const createVolumeSchema = z.object({
  rudder_id: z.string().min(1, 'Rudder ID is required'),
  name: z.string().min(1, 'Volume name is required'),
  driver: z.string().optional().default('local'),
  labels: z.record(z.string()).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const jobFilterSchema = z.object({
  status: z.enum(['pending', 'running', 'done', 'failed']).optional(),
  rudder_id: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export const containerFilterSchema = z.object({
  status: z.enum(['running', 'stopped', 'exited']).optional(),
  rudder_id: z.string().optional(),
  image: z.string().optional(),
});

export const settingsUpdateSchema = z.object({
  jobRetentionDays: z.number().int().min(1).max(365).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateContainerInput = z.infer<typeof createContainerSchema>;
export type PullImageInput = z.infer<typeof pullImageSchema>;
export type CreateVolumeInput = z.infer<typeof createVolumeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
export type ContainerFilterInput = z.infer<typeof containerFilterSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
