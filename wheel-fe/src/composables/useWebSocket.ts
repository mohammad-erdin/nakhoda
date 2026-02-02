import { ref, onBeforeUnmount } from 'vue';
import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@nakhoda/shared/constants';
import { useRudders } from '@/stores/rudders';
import { useJobs } from '@/stores/jobs';
import { useContainers } from '@/stores/containers';

const WS_URL = import.meta.env.VITE_WS_URL || '';
export function useWebSocket() {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);

  const connect = () => {
    if (socket.value) return;
    socket.value = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    const rudders = useRudders();
    const jobs = useJobs();
    const containers = useContainers();

    socket.value.on('connect', () => {
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });

    socket.value.on(WS_EVENTS.BROADCAST_RUDDER_ONLINE, (payload: { rudder_id: string }) => {
      rudders.updateRudderStatus(payload.rudder_id, 'online');
    });

    socket.value.on(WS_EVENTS.BROADCAST_RUDDER_OFFLINE, (payload: { rudder_id: string }) => {
      rudders.updateRudderStatus(payload.rudder_id, 'offline');
    });

    socket.value.on(WS_EVENTS.BROADCAST_JOB_COMPLETE, (payload: { job_id: string; status: string }) => {
      jobs.markJobComplete(payload.job_id, payload.status as 'done' | 'failed');
    });

    socket.value.on(WS_EVENTS.BROADCAST_CONTAINERS_UPDATED, (payload: { rudder_id: string; containers: any[] }) => {
      containers.updateContainerList(payload.containers);
    });
  };

  const disconnect = () => {
    socket.value?.disconnect();
    socket.value = null;
    isConnected.value = false;
  };

  onBeforeUnmount(() => {
    disconnect();
  });

  return { socket, isConnected, connect, disconnect };
}
