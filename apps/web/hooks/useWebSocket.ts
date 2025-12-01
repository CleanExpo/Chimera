"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export interface ThoughtStreamMessage {
  type: "thought" | "code" | "status" | "error" | "complete";
  team: "anthropic" | "google";
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface JobStatusMessage {
  jobId: string;
  status: string;
  teams: Record<string, {
    status: string;
    thoughts: string[];
    code?: string;
    tokens?: number;
  }>;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (data: ThoughtStreamMessage | JobStatusMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  connect: () => void;
  disconnect: () => void;
  send: (data: unknown) => void;
  subscribe: (jobId: string) => void;
  unsubscribe: (jobId: string) => void;
}

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8888/ws";

/**
 * Hook for connecting to the backend WebSocket for real-time streaming
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = DEFAULT_WS_URL,
    autoConnect = false,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedJobsRef = useRef<Set<string>>(new Set());

  const updateStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    updateStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus("connected");
        reconnectCountRef.current = 0;

        // Re-subscribe to any jobs we were watching
        subscribedJobsRef.current.forEach((jobId) => {
          ws.send(JSON.stringify({ type: "subscribe", jobId }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = () => {
        updateStatus("error");
      };

      ws.onclose = () => {
        updateStatus("disconnected");
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      updateStatus("error");
    }
  }, [url, reconnectAttempts, reconnectInterval, onMessage, updateStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectCountRef.current = reconnectAttempts; // Prevent reconnection

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateStatus("disconnected");
  }, [reconnectAttempts, updateStatus]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }, []);

  const subscribe = useCallback((jobId: string) => {
    subscribedJobsRef.current.add(jobId);
    send({ type: "subscribe", jobId });
  }, [send]);

  const unsubscribe = useCallback((jobId: string) => {
    subscribedJobsRef.current.delete(jobId);
    send({ type: "unsubscribe", jobId });
  }, [send]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for streaming thoughts from a specific job
 */
export function useJobStream(jobId: string | null) {
  const [thoughts, setThoughts] = useState<ThoughtStreamMessage[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatusMessage | null>(null);

  const handleMessage = useCallback((data: ThoughtStreamMessage | JobStatusMessage) => {
    if ("type" in data && data.type) {
      // ThoughtStreamMessage
      setThoughts((prev) => [...prev, data as ThoughtStreamMessage]);
    } else if ("jobId" in data) {
      // JobStatusMessage
      setJobStatus(data as JobStatusMessage);
    }
  }, []);

  const { status, connect, subscribe, unsubscribe } = useWebSocket({
    autoConnect: !!jobId,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (jobId && status === "connected") {
      subscribe(jobId);
      return () => unsubscribe(jobId);
    }
  }, [jobId, status, subscribe, unsubscribe]);

  const clearThoughts = useCallback(() => {
    setThoughts([]);
  }, []);

  return {
    thoughts,
    jobStatus,
    connectionStatus: status,
    connect,
    clearThoughts,
  };
}
