"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getJobs,
  getJob,
  getJobMetrics,
  subscribeToJobUpdates,
  type OrchestrationJob,
  type JobsResponse,
} from "@/lib/api/jobs";

interface UseJobsOptions {
  limit?: number;
  status?: string;
  realtime?: boolean;
}

interface UseJobsReturn {
  jobs: OrchestrationJob[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing jobs list
 */
export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { limit = 20, status, realtime = true } = options;
  const [jobs, setJobs] = useState<OrchestrationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchJobs = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentOffset = reset ? 0 : offset;
        const response = await getJobs({ limit, offset: currentOffset, status });

        if (reset) {
          setJobs(response.jobs);
        } else {
          setJobs((prev) => [...prev, ...response.jobs]);
        }

        setTotal(response.total);
        setHasMore(response.hasMore);
        setOffset(currentOffset + response.jobs.length);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch jobs"));
      } finally {
        setLoading(false);
      }
    },
    [limit, offset, status]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchJobs(false);
  }, [fetchJobs, hasMore, loading]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchJobs(true);
  }, [fetchJobs]);

  // Initial fetch
  useEffect(() => {
    fetchJobs(true);
  }, [status]); // Re-fetch when status filter changes

  // Real-time subscriptions
  useEffect(() => {
    if (!realtime) return;

    const unsubscribe = subscribeToJobUpdates((updatedJob) => {
      setJobs((prev) => {
        const index = prev.findIndex((j) => j.id === updatedJob.id);
        if (index >= 0) {
          // Update existing job
          const newJobs = [...prev];
          newJobs[index] = updatedJob;
          return newJobs;
        } else {
          // New job - add to beginning
          return [updatedJob, ...prev];
        }
      });
    });

    return unsubscribe;
  }, [realtime]);

  return {
    jobs,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
  };
}

interface UseJobReturn {
  job: OrchestrationJob | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching a single job
 */
export function useJob(jobId: string | null): UseJobReturn {
  const [job, setJob] = useState<OrchestrationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getJob(jobId);
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch job"));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Real-time updates for this job
  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = subscribeToJobUpdates((updatedJob) => {
      if (updatedJob.id === jobId) {
        setJob(updatedJob);
      }
    });

    return unsubscribe;
  }, [jobId]);

  return {
    job,
    loading,
    error,
    refresh: fetchJob,
  };
}

interface UseJobMetricsReturn {
  metrics: {
    totalJobs: number;
    completedJobs: number;
    successRate: number;
    totalTokens: number;
    totalCost: number;
    avgDuration: number;
  } | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching job metrics
 */
export function useJobMetrics(): UseJobMetricsReturn {
  const [metrics, setMetrics] = useState<UseJobMetricsReturn["metrics"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJobMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch metrics"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
