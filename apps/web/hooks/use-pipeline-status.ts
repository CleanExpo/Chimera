"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DeploymentPipelineState,
  PipelineStage,
  StageStatus,
  DEFAULT_PIPELINE_STATE,
} from "@/lib/types/pipeline";

interface UsePipelineStatusOptions {
  /** Polling interval in milliseconds. Set to 0 to disable polling. */
  pollInterval?: number;
  /** Enable WebSocket for real-time updates */
  realtime?: boolean;
  /** Initial state */
  initialState?: DeploymentPipelineState;
}

interface UsePipelineStatusReturn {
  state: DeploymentPipelineState;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateStageStatus: (stageId: string, status: StageStatus, message?: string) => void;
}

/**
 * Hook for managing deployment pipeline status
 *
 * Provides:
 * - Automatic polling for status updates
 * - Manual refresh capability
 * - Local state updates for optimistic UI
 * - Error handling
 */
export function usePipelineStatus(
  options: UsePipelineStatusOptions = {}
): UsePipelineStatusReturn {
  const {
    pollInterval = 10000, // 10 seconds default
    realtime = false,
    initialState = DEFAULT_PIPELINE_STATE,
  } = options;

  const [state, setState] = useState<DeploymentPipelineState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch pipeline status from API
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await fetch('/api/pipeline/status');
      // const data = await response.json();
      // setState(data);

      // For now, use mock data with simulated updates
      setState((prev) => ({
        ...prev,
        lastDeployment: new Date(),
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch pipeline status"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Update a specific stage's status (optimistic update)
  const updateStageStatus = useCallback(
    (stageId: string, status: StageStatus, message?: string) => {
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                status,
                statusMessage: message || stage.statusMessage,
                timestamp: new Date(),
              }
            : stage
        ),
      }));
    },
    []
  );

  // Polling effect
  useEffect(() => {
    if (pollInterval <= 0) return;

    const intervalId = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval, fetchStatus]);

  // WebSocket effect for real-time updates
  useEffect(() => {
    if (!realtime) return;

    // TODO: Implement WebSocket connection when backend supports it
    // const ws = new WebSocket('ws://localhost:8888/ws/pipeline');
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data);
    //   setState((prev) => ({ ...prev, ...update }));
    // };
    // return () => ws.close();
  }, [realtime]);

  return {
    state,
    isLoading,
    error,
    refresh,
    updateStageStatus,
  };
}

/**
 * Hook for simulating pipeline activity (for demos/development)
 */
export function usePipelineSimulation() {
  const [state, setState] = useState<DeploymentPipelineState>(DEFAULT_PIPELINE_STATE);
  const [isSimulating, setIsSimulating] = useState(false);

  const startSimulation = useCallback(async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const stages: Array<{ id: string; delay: number }> = [
      { id: "development", delay: 1000 },
      { id: "build", delay: 3000 },
      { id: "staging", delay: 2000 },
      { id: "production", delay: 2000 },
    ];

    // Reset all to idle
    setState((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => ({ ...s, status: "idle" as StageStatus })),
    }));

    for (const { id, delay } of stages) {
      // Set current stage to active
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((s) =>
          s.id === id
            ? { ...s, status: "active" as StageStatus, statusMessage: "In progress..." }
            : s
        ),
      }));

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Set stage to success
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((s) =>
          s.id === id
            ? { ...s, status: "success" as StageStatus, statusMessage: "Complete", timestamp: new Date() }
            : s
        ),
      }));
    }

    setIsSimulating(false);
  }, [isSimulating]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  return {
    state,
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
