import { useEffect, useRef, useCallback, useState } from "react";

export type WSMessageType =
  | "connected"
  | "status_change"
  | "phase_change"
  | "thought_added"
  | "code_generated"
  | "error"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  team?: "anthropic" | "google" | "workflow";
  data: any;
  timestamp: string;
  job_id?: string;
}

export interface UseOrchestrationSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useOrchestrationSocket(
  jobId: string | undefined,
  options: UseOrchestrationSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 2000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const cleanup = useCallback(() => {
    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!jobId) {
      return;
    }

    // Don't create multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    cleanup();

    try {
      // Determine WebSocket URL based on environment
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8888";
      const protocol = backendUrl.startsWith("https") ? "wss:" : "ws:";
      const host = backendUrl.replace(/^https?:\/\//, "");
      const wsUrl = `${protocol}//${host}/ws/orchestrate/${jobId}`;

      console.log(`[WebSocket] Connecting to ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to job ${jobId}`);
        setIsConnected(true);
        reconnectCountRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 30000); // Ping every 30 seconds

        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log(`[WebSocket] Message received:`, message.type, message.team);
          onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(
            `[WebSocket] Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log("[WebSocket] Max reconnect attempts reached");
        }
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
      setIsConnected(false);
    }
  }, [
    jobId,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts,
    reconnectInterval,
    cleanup,
  ]);

  // Connect when jobId changes
  useEffect(() => {
    if (jobId) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [jobId, connect, cleanup]);

  const disconnect = useCallback(() => {
    reconnectCountRef.current = reconnectAttempts; // Prevent reconnect
    cleanup();
  }, [cleanup, reconnectAttempts]);

  return {
    isConnected,
    disconnect,
    reconnect: connect,
  };
}
