"use client";

import { useState, useCallback } from "react";
import { useWorkspace } from "./useWorkspace";

export type TestFramework = "jest" | "vitest" | "mocha" | "pytest" | "cargo" | "go" | "unknown" | "custom";

export interface TestConfig {
  framework: TestFramework;
  command: string;
  configFile?: string;
  testFiles: string[];
  testFileCount: number;
}

export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration?: number;
}

export interface TestRun {
  id: string;
  timestamp: string;
  success: boolean;
  framework: TestFramework;
  command: string;
  output: string;
  results: TestResults;
  exitCode: number;
  error?: string;
  testFile?: string;
  testName?: string;
}

interface UseTestRunnerReturn {
  // State
  config: TestConfig | null;
  currentRun: TestRun | null;
  runHistory: TestRun[];
  isRunning: boolean;
  isLoadingConfig: boolean;
  error: string | null;

  // Actions
  loadConfig: () => Promise<TestConfig | null>;
  runTests: (options?: {
    testFile?: string;
    testName?: string;
    watch?: boolean;
    coverage?: boolean;
    customCommand?: string;
  }) => Promise<TestRun | null>;
  clearHistory: () => void;

  // Computed
  lastRun: TestRun | null;
  passRate: number;
}

/**
 * Hook for running tests in the workspace project
 */
export function useTestRunner(): UseTestRunnerReturn {
  const { activeProject, hasActiveProject } = useWorkspace();
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [runHistory, setRunHistory] = useState<TestRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspacePath = activeProject?.path || "";

  /**
   * Load test configuration for the workspace
   */
  const loadConfig = useCallback(async (): Promise<TestConfig | null> => {
    if (!hasActiveProject || !workspacePath) {
      setError("No active workspace");
      return null;
    }

    setIsLoadingConfig(true);
    setError(null);

    try {
      const params = new URLSearchParams({ workspace: workspacePath });
      const response = await fetch(`/api/workspace/tests?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load test config");
      }

      const data = await response.json();
      setConfig(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load test config";
      setError(message);
      return null;
    } finally {
      setIsLoadingConfig(false);
    }
  }, [hasActiveProject, workspacePath]);

  /**
   * Run tests in the workspace
   */
  const runTests = useCallback(
    async (options?: {
      testFile?: string;
      testName?: string;
      watch?: boolean;
      coverage?: boolean;
      customCommand?: string;
    }): Promise<TestRun | null> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return null;
      }

      setIsRunning(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            ...options,
          }),
        });

        const data = await response.json();

        const run: TestRun = {
          id: `test-${Date.now()}`,
          timestamp: new Date().toISOString(),
          success: data.success,
          framework: data.framework,
          command: data.command,
          output: data.output,
          results: data.results,
          exitCode: data.exitCode,
          error: data.error,
          testFile: options?.testFile,
          testName: options?.testName,
        };

        setCurrentRun(run);
        setRunHistory((prev) => [run, ...prev].slice(0, 50)); // Keep last 50 runs

        return run;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to run tests";
        setError(message);
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [hasActiveProject, workspacePath]
  );

  /**
   * Clear run history
   */
  const clearHistory = useCallback(() => {
    setRunHistory([]);
    setCurrentRun(null);
  }, []);

  // Computed values
  const lastRun = runHistory[0] || null;

  const passRate =
    runHistory.length > 0
      ? runHistory.filter((r) => r.success).length / runHistory.length
      : 0;

  return {
    config,
    currentRun,
    runHistory,
    isRunning,
    isLoadingConfig,
    error,
    loadConfig,
    runTests,
    clearHistory,
    lastRun,
    passRate,
  };
}
