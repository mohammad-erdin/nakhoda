export const JOB_ACTIONS = {
  CONTAINER_CREATE: 'container.create',
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_RESTART: 'container.restart',
  CONTAINER_DELETE: 'container.delete',
  CONTAINER_PRUNE: 'container.prune',
  IMAGE_PULL: 'image.pull',
  IMAGE_DELETE: 'image.delete',
  IMAGE_PRUNE: 'image.prune',
  VOLUME_CREATE: 'volume.create',
  VOLUME_DELETE: 'volume.delete',
  VOLUME_PRUNE: 'volume.prune',
} as const;

export type JobAction = typeof JOB_ACTIONS[keyof typeof JOB_ACTIONS];
