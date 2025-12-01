"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAuditEvents,
  getJobAuditEvents,
  subscribeToAuditEvents,
  logAuditEvent,
  type AuditEvent,
  type AuditCategory,
  type AuditSeverity,
  type AuditEventsResponse,
  type LogAuditEventParams,
} from "@/lib/api/audit";

interface UseAuditEventsOptions {
  limit?: number;
  category?: AuditCategory;
  jobId?: string;
  severity?: AuditSeverity;
  realtime?: boolean;
}

interface UseAuditEventsReturn {
  events: AuditEvent[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing audit events
 */
export function useAuditEvents(options: UseAuditEventsOptions = {}): UseAuditEventsReturn {
  const { limit = 20, category, jobId, severity, realtime = true } = options;
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchEvents = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentOffset = reset ? 0 : offset;
        const response = await getAuditEvents({
          limit,
          offset: currentOffset,
          category,
          jobId,
          severity,
        });

        if (reset) {
          setEvents(response.events);
        } else {
          setEvents((prev) => [...prev, ...response.events]);
        }

        setTotal(response.total);
        setHasMore(response.hasMore);
        setOffset(currentOffset + response.events.length);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch audit events"));
      } finally {
        setLoading(false);
      }
    },
    [limit, offset, category, jobId, severity]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchEvents(false);
  }, [fetchEvents, hasMore, loading]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchEvents(true);
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents(true);
  }, [category, jobId, severity]); // Re-fetch when filters change

  // Real-time subscriptions
  useEffect(() => {
    if (!realtime) return;

    const unsubscribe = subscribeToAuditEvents(
      (newEvent) => {
        // Only add if it matches our filters
        const matchesCategory = !category || newEvent.category === category;
        const matchesJob = !jobId || newEvent.job_id === jobId;
        const matchesSeverity = !severity || newEvent.severity === severity;

        if (matchesCategory && matchesJob && matchesSeverity) {
          setEvents((prev) => [newEvent, ...prev]);
          setTotal((prev) => prev + 1);
        }
      },
      { category }
    );

    return unsubscribe;
  }, [realtime, category, jobId, severity]);

  return {
    events,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
  };
}

interface UseJobAuditReturn {
  events: AuditEvent[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching audit events for a specific job
 */
export function useJobAudit(jobId: string | null): UseJobAuditReturn {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!jobId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getJobAuditEvents(jobId);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch job audit events"));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time updates for this job
  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = subscribeToAuditEvents((newEvent) => {
      if (newEvent.job_id === jobId) {
        setEvents((prev) => [...prev, newEvent]);
      }
    });

    return unsubscribe;
  }, [jobId]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
  };
}

/**
 * Hook for logging audit events
 */
export function useAuditLogger() {
  const log = useCallback(async (params: LogAuditEventParams) => {
    return logAuditEvent(params);
  }, []);

  return { log };
}
