export const WS_EVENTS = {
  RUDDER_REGISTER: 'rudder:register',
  RUDDER_HEARTBEAT: 'rudder:heartbeat',
  RUDDER_JOB_COMPLETE: 'rudder:job_complete',
  RUDDER_ERROR: 'rudder:error',
  WHEEL_JOB_DISPATCH: 'wheel:job_dispatch',
  WHEEL_ACK: 'wheel:ack',
  BROADCAST_RUDDER_ONLINE: 'broadcast:rudder_online',
  BROADCAST_RUDDER_OFFLINE: 'broadcast:rudder_offline',
  BROADCAST_JOB_COMPLETE: 'broadcast:job_complete',
  BROADCAST_CONTAINERS_UPDATED: 'broadcast:containers_updated',
} as const;
