"use client";

import { useState, useCallback, useEffect } from "react";
import { useWorkspace } from "./useWorkspace";

interface VSCodeStatus {
  available: boolean;
  command?: string;
  version?: string;
}

interface UseVSCodeReturn {
  // State
  status: VSCodeStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkAvailability: () => Promise<VSCodeStatus | null>;
  openWorkspace: (reuse?: boolean) => Promise<boolean>;
  openFile: (file: string, options?: { line?: number; column?: number; reuse?: boolean }) => Promise<boolean>;
  openDiff: (left: string, right: string) => Promise<boolean>;
  createAndOpenFile: (file: string, reuse?: boolean) => Promise<boolean>;

  // Helpers
  isAvailable: boolean;
  workspacePath: string;
}

/**
 * Hook for VS Code integration
 */
export function useVSCode(): UseVSCodeReturn {
  const { activeProject, hasActiveProject } = useWorkspace();
  const [status, setStatus] = useState<VSCodeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspacePath = activeProject?.path || "";

  /**
   * Check if VS Code is available
   */
  const checkAvailability = useCallback(async (): Promise<VSCodeStatus | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workspace/vscode");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check VS Code");
      }

      const data = await response.json();
      setStatus(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check VS Code";
      setError(message);
      setStatus({ available: false });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  /**
   * Open workspace in VS Code
   */
  const openWorkspace = useCallback(
    async (reuse: boolean = true): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "open-workspace",
            workspace: workspacePath,
            reuse,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to open workspace");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to open workspace";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath]
  );

  /**
   * Open a file in VS Code
   */
  const openFile = useCallback(
    async (
      file: string,
      options?: { line?: number; column?: number; reuse?: boolean }
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "open-file",
            workspace: workspacePath || undefined,
            file,
            line: options?.line,
            column: options?.column,
            reuse: options?.reuse ?? true,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to open file");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to open file";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [workspacePath]
  );

  /**
   * Open diff view for two files
   */
  const openDiff = useCallback(
    async (left: string, right: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "diff",
            workspace: workspacePath || undefined,
            diff: { left, right },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to open diff");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to open diff";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [workspacePath]
  );

  /**
   * Create and open a new file
   */
  const createAndOpenFile = useCallback(
    async (file: string, reuse: boolean = true): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "new-file",
            workspace: workspacePath || undefined,
            file,
            reuse,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create file");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create file";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [workspacePath]
  );

  return {
    status,
    isLoading,
    error,
    checkAvailability,
    openWorkspace,
    openFile,
    openDiff,
    createAndOpenFile,
    isAvailable: status?.available ?? false,
    workspacePath,
  };
}
