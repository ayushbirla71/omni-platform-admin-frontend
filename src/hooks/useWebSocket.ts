import { useEffect, useState } from "react";
import {
  platformRealtimeClient,
  ConnectionStatus,
  RealtimeEventHandler,
} from "../lib/socket";
import { usePlatformAuth } from "../context/PlatformAuthContext";

export function useWebSocket() {
  const { user } = usePlatformAuth();
  const [status, setStatus] = useState<ConnectionStatus>(platformRealtimeClient.getStatus());

  useEffect(() => {
    const token = localStorage.getItem("platform_auth_token");
    if (user || token) {
      platformRealtimeClient.connect();
    }

    const unsubscribe = platformRealtimeClient.onStatusChange(setStatus);
    return () => {
      unsubscribe();
    };
  }, [user]);

  return {
    status,
    isConnected: status === "connected",
    subscribe: (channel: string) => platformRealtimeClient.subscribe(channel),
    unsubscribe: (channel: string) => platformRealtimeClient.unsubscribe(channel),
    on: <T = any>(event: string, handler: RealtimeEventHandler<T>) =>
      platformRealtimeClient.on<T>(event, handler),
  };
}

/**
 * Hook to listen to a specific realtime event with automatic lifecycle cleanup
 */
export function useRealtimeEvent<T = any>(event: string, handler: RealtimeEventHandler<T>) {
  useEffect(() => {
    const unsubscribe = platformRealtimeClient.on<T>(event, handler);
    return () => {
      unsubscribe();
    };
  }, [event, handler]);
}
