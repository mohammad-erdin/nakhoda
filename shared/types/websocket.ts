import type { Container } from './entities';

export interface RudderRegisterPayload {
  token: string;
  hostname: string;
  dockerVersion: string;
}

export interface RudderHeartbeatPayload {
  rudder_id: string;
}

export interface RudderJobCompletePayload {
  job_id: string;
  status: 'done' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
}

export interface WheelJobDispatchPayload {
  job_id: string;
  action: string;
  params: Record<string, unknown>;
}

export interface WheelAckPayload {
  timestamp: number;
}

export interface BroadcastRudderOnlinePayload {
  rudder_id: string;
}

export interface BroadcastRudderOfflinePayload {
  rudder_id: string;
}

export interface BroadcastJobCompletePayload {
  job_id: string;
  status: 'done' | 'failed';
}

export interface BroadcastContainersUpdatedPayload {
  rudder_id: string;
  containers: Container[];
}
