"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getJobHistory,
  getJobDetails,
  type JobHistoryItem,
  type JobHistoryFilters,
  type OrchestrationResponse,
} from "@/lib/api/orchestrate";

interface UseJobHistoryResult {
  jobs: JobHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setFilters: (filters: JobHistoryFilters) => void;
  setPage: (page: number) => void;
}

interface UseJobDetailsResult {
  job: OrchestrationResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing job history
 */
export function useJobHistory(
  initialFilters?: JobHistoryFilters
): UseJobHistoryResult {
  const [jobs, setJobs] = useState<JobHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFilters?.page || 1);
  const [pageSize] = useState(initialFilters?.page_size || 10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobHistoryFilters>(
    initialFilters || {}
  );

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getJobHistory({
        ...filters,
        page,
        page_size: pageSize,
      });

      setJobs(response.jobs);
      setTotal(response.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job history";
      setError(errorMessage);
      console.error("Error fetching job history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSetFilters = useCallback((newFilters: JobHistoryFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  return {
    jobs,
    total,
    page,
    pageSize,
    isLoading,
    error,
    refetch: fetchHistory,
    setFilters: handleSetFilters,
    setPage,
  };
}

/**
 * Hook for fetching detailed job information
 */
export function useJobDetails(jobId: string | null): UseJobDetailsResult {
  const [job, setJob] = useState<OrchestrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getJobDetails(jobId);
      setJob(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job details";
      setError(errorMessage);
      console.error("Error fetching job details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    job,
    isLoading,
    error,
    refetch: fetchDetails,
  };
}
