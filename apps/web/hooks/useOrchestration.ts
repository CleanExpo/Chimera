"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  submitBrief,
  getJobStatus,
  cancelJob,
  checkBackendHealth,
  type BriefPayload,
  type OrchestrationResponse,
  type OrchestrationStatusResponse,
  type TeamOutput,
  type OrchestrationStatus,
} from "@/lib/api/orchestrate";
import { useWebSocket, type ThoughtStreamMessage } from "./useWebSocket";
import { useNotifications } from "./useNotifications";
import { auditJobStarted, auditJobCompleted } from "@/lib/api/audit";

export interface UseOrchestrationOptions {
  onJobComplete?: (job: OrchestrationResponse) => void;
  onError?: (error: Error) => void;
  pollInterval?: number;
}

export interface UseOrchestrationReturn {
  // State
  currentJob: OrchestrationResponse | null;
  jobStatus: OrchestrationStatusResponse | null;
  isSubmitting: boolean;
  isPolling: boolean;
  error: Error | null;
  backendHealthy: boolean;
  thoughts: ThoughtStreamMessage[];

  // Actions
  submit: (payload: BriefPayload) => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
  checkHealth: () => Promise<boolean>;
}

/**
 * Hook for managing orchestration job lifecycle with real-time updates
 */
export function useOrchestration(
  options: UseOrchestrationOptions = {}
): UseOrchestrationReturn {
  const { onJobComplete, onError, pollInterval = 2000 } = options;

  const [currentJob, setCurrentJob] = useState<OrchestrationResponse | null>(null);
  const [jobStatus, setJobStatus] = useState<OrchestrationStatusResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [thoughts, setThoughts] = useState<ThoughtStreamMessage[]>([]);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { jobComplete, systemMessage } = useNotifications();

  // WebSocket for real-time thought streaming
  const handleWsMessage = useCallback((data: ThoughtStreamMessage | import("./useWebSocket").JobStatusMessage) => {
    // Only handle thought stream messages
    if ("type" in data && (data.type === "thought" || data.type === "code")) {
      setThoughts((prev) => [...prev, data as ThoughtStreamMessage]);
    }
  }, []);

  const { status: wsStatus, connect: wsConnect, subscribe, unsubscribe } = useWebSocket({
    onMessage: handleWsMessage,
  });

  // Check backend health
  const checkHealth = useCallback(async () => {
    const healthy = await checkBackendHealth();
    setBackendHealthy(healthy);
    return healthy;
  }, []);

  // Poll job status
  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const status = await getJobStatus(jobId);
      setJobStatus(status);

      // Check if job is complete
      const isComplete = status.status === "complete" || status.status === "error";

      if (isComplete) {
        setIsPolling(false);

        // Fetch full job details
        if (currentJob) {
          const updatedJob = { ...currentJob, status: status.status as OrchestrationStatus, teams: status.teams };
          setCurrentJob(updatedJob);

          // Log audit event
          const teamsUsed = Object.keys(status.teams);
          await auditJobCompleted(jobId, status.status === "complete", teamsUsed);

          // Notify
          jobComplete(jobId, currentJob.brief_summary, status.status === "complete");
          onJobComplete?.(updatedJob);
        }

        // Unsubscribe from WebSocket
        unsubscribe(jobId);
      } else {
        // Continue polling
        pollTimeoutRef.current = setTimeout(() => pollStatus(jobId), pollInterval);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to get job status");
      setError(error);
      setIsPolling(false);
      onError?.(error);
    }
  }, [currentJob, pollInterval, jobComplete, onJobComplete, onError, unsubscribe]);

  // Submit a new brief
  const submit = useCallback(async (payload: BriefPayload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setThoughts([]);

      // Check backend health first
      const healthy = await checkHealth();
      if (!healthy) {
        throw new Error("Backend service is not available. Please try again later.");
      }

      // Submit brief
      const response = await submitBrief(payload);
      setCurrentJob(response);
      setJobStatus(null);

      // Log audit event
      await auditJobStarted(response.job_id, payload.brief);

      // Subscribe to WebSocket for real-time updates
      if (wsStatus === "connected") {
        subscribe(response.job_id);
      } else {
        wsConnect();
        // Will subscribe after connection
      }

      // Start polling for status
      setIsPolling(true);
      pollTimeoutRef.current = setTimeout(() => pollStatus(response.job_id), pollInterval);

      systemMessage("Job Submitted", `Started generating: ${response.brief_summary}`, "info");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to submit brief");
      setError(error);
      onError?.(error);
      systemMessage("Submission Failed", error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [checkHealth, wsStatus, subscribe, wsConnect, pollStatus, pollInterval, systemMessage, onError]);

  // Cancel current job
  const cancel = useCallback(async () => {
    if (!currentJob) return;

    try {
      await cancelJob(currentJob.job_id);

      // Stop polling
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      setIsPolling(false);

      // Unsubscribe from WebSocket
      unsubscribe(currentJob.job_id);

      // Update state
      setCurrentJob((prev) => prev ? { ...prev, status: "error" as OrchestrationStatus } : null);
      setJobStatus((prev) => prev ? { ...prev, status: "cancelled" } : null);

      systemMessage("Job Cancelled", "The orchestration job has been cancelled", "warning");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to cancel job");
      setError(error);
      onError?.(error);
    }
  }, [currentJob, unsubscribe, systemMessage, onError]);

  // Reset state for new job
  const reset = useCallback(() => {
    // Clean up
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    if (currentJob) {
      unsubscribe(currentJob.job_id);
    }

    // Reset state
    setCurrentJob(null);
    setJobStatus(null);
    setError(null);
    setThoughts([]);
    setIsPolling(false);
  }, [currentJob, unsubscribe]);

  // Subscribe to WebSocket when connection established
  useEffect(() => {
    if (wsStatus === "connected" && currentJob && isPolling) {
      subscribe(currentJob.job_id);
    }
  }, [wsStatus, currentJob, isPolling, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Initial health check
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    currentJob,
    jobStatus,
    isSubmitting,
    isPolling,
    error,
    backendHealthy,
    thoughts,
    submit,
    cancel,
    reset,
    checkHealth,
  };
}

/**
 * Get progress percentage based on job status
 */
export function getJobProgress(status: OrchestrationStatusResponse | null): number {
  if (!status) return 0;

  switch (status.status) {
    case "received":
      return 10;
    case "planning":
      return 25;
    case "dispatching":
      return 40;
    case "awaiting":
      return 75;
    case "complete":
      return 100;
    case "error":
      return 100;
    default:
      return status.progress || 0;
  }
}

/**
 * Get team completion status
 */
export function getTeamProgress(team: TeamOutput): number {
  switch (team.status) {
    case "pending":
      return 0;
    case "thinking":
      return 33;
    case "generating":
      return 66;
    case "complete":
      return 100;
    case "error":
      return 100;
    default:
      return 0;
  }
}
