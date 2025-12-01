"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  SelfHealingEvent,
  EventStatus,
} from "@/lib/types/self-healing";

interface SelfHealingStats {
  total: number;
  last24h: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  autoResolved: number;
  successRate: number;
}

interface UseSelfHealingReturn {
  // State
  events: SelfHealingEvent[];
  pendingCount: number;
  stats: SelfHealingStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEvents: (status?: EventStatus) => Promise<void>;
  fetchStats: () => Promise<void>;
  reportEvent: (event: {
    source: string;
    type: string;
    severity: string;
    description: string;
    details?: Record<string, unknown>;
  }) => Promise<SelfHealingEvent | null>;
  approveAction: (actionId: string) => Promise<boolean>;
  rejectAction: (actionId: string, reason?: string) => Promise<boolean>;
  simulateEvent: () => Promise<SelfHealingEvent | null>;

  // Monitoring
  startMonitoring: (intervalMs?: number) => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

/**
 * Hook for self-healing system operations
 */
export function useSelfHealing(): UseSelfHealingReturn {
  const [events, setEvents] = useState<SelfHealingEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState<SelfHealingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(async (status?: EventStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);

      const response = await fetch(`/api/self-healing?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events);
      setPendingCount(data.pending);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/self-healing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-stats" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  /**
   * Report a new event
   */
  const reportEvent = useCallback(
    async (event: {
      source: string;
      type: string;
      severity: string;
      description: string;
      details?: Record<string, unknown>;
    }): Promise<SelfHealingEvent | null> => {
      setError(null);

      try {
        const response = await fetch("/api/self-healing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "report-event",
            ...event,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to report event");
        }

        const data = await response.json();

        // Refresh events list
        await fetchEvents();

        return data.event;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to report event";
        setError(message);
        return null;
      }
    },
    [fetchEvents]
  );

  /**
   * Approve a pending action
   */
  const approveAction = useCallback(
    async (actionId: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch("/api/self-healing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve-action",
            actionId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to approve action");
        }

        // Refresh events list
        await fetchEvents();

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve action";
        setError(message);
        return false;
      }
    },
    [fetchEvents]
  );

  /**
   * Reject a pending action
   */
  const rejectAction = useCallback(
    async (actionId: string, reason?: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch("/api/self-healing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reject-action",
            actionId,
            reason,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to reject action");
        }

        // Refresh events list
        await fetchEvents();

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject action";
        setError(message);
        return false;
      }
    },
    [fetchEvents]
  );

  /**
   * Simulate a random event (for demo)
   */
  const simulateEvent = useCallback(async (): Promise<SelfHealingEvent | null> => {
    setError(null);

    try {
      const response = await fetch("/api/self-healing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate-event" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to simulate event");
      }

      const data = await response.json();

      // Refresh events list
      await fetchEvents();

      return data.event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to simulate event";
      setError(message);
      return null;
    }
  }, [fetchEvents]);

  /**
   * Start monitoring (polling for events)
   */
  const startMonitoring = useCallback(
    (intervalMs: number = 5000) => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }

      setIsMonitoring(true);

      // Initial fetch
      fetchEvents();
      fetchStats();

      // Set up polling
      monitoringIntervalRef.current = setInterval(() => {
        fetchEvents();
        fetchStats();
      }, intervalMs);
    },
    [fetchEvents, fetchStats]
  );

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return {
    events,
    pendingCount,
    stats,
    isLoading,
    error,
    fetchEvents,
    fetchStats,
    reportEvent,
    approveAction,
    rejectAction,
    simulateEvent,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  };
}
