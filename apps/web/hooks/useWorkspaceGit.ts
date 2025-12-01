"use client";

import { useState, useCallback } from "react";
import { useWorkspace } from "./useWorkspace";

export interface GitChange {
  file: string;
  status: string;
  staged: boolean;
  unstaged: boolean;
}

export interface GitCommit {
  hash: string;
  subject: string;
  authorName: string;
  authorEmail: string;
  date: string;
}

export interface GitStatus {
  branch: string;
  changes: GitChange[];
  staged: number;
  unstaged: number;
  untracked: number;
  remotes: Record<string, { fetch?: string; push?: string }>;
  lastCommit: GitCommit | null;
  clean: boolean;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
}

interface UseWorkspaceGitReturn {
  // State
  status: GitStatus | null;
  branches: GitBranch[];
  isLoading: boolean;
  error: string | null;

  // Read Operations
  getStatus: () => Promise<GitStatus | null>;
  getLog: (limit?: number) => Promise<GitCommit[]>;
  getDiff: (file?: string, staged?: boolean) => Promise<string>;
  getBranches: () => Promise<GitBranch[]>;

  // Write Operations
  addFiles: (files: string[]) => Promise<boolean>;
  commit: (message: string, files?: string[]) => Promise<{ success: boolean; hash?: string }>;
  push: (remote?: string, branch?: string) => Promise<boolean>;
  pull: (remote?: string, branch?: string) => Promise<boolean>;
  checkout: (branch: string, create?: boolean) => Promise<boolean>;
  stash: (pop?: boolean, message?: string) => Promise<boolean>;
  resetFile: (file: string) => Promise<boolean>;

  // Helpers
  isGitReady: boolean;
  hasChanges: boolean;
  hasStagedChanges: boolean;
}

/**
 * Hook for git operations within the active workspace
 */
export function useWorkspaceGit(): UseWorkspaceGitReturn {
  const { activeProject, activeContext, hasActiveProject } = useWorkspace();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspacePath = activeProject?.path || "";
  const hasGit = activeContext?.hasGit ?? false;

  /**
   * Get git status
   */
  const getStatus = useCallback(async (): Promise<GitStatus | null> => {
    if (!hasActiveProject || !workspacePath || !hasGit) {
      setError("No git repository");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspace: workspacePath,
        action: "status",
      });

      const response = await fetch(`/api/workspace/git?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get status");
      }

      const data = await response.json();
      setStatus(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get status";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasActiveProject, workspacePath, hasGit]);

  /**
   * Get commit log
   */
  const getLog = useCallback(
    async (limit: number = 10): Promise<GitCommit[]> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          workspace: workspacePath,
          action: "log",
          limit: limit.toString(),
        });

        const response = await fetch(`/api/workspace/git?${params}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get log");
        }

        const data = await response.json();
        return data.commits;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get log";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit]
  );

  /**
   * Get diff
   */
  const getDiff = useCallback(
    async (file?: string, staged: boolean = false): Promise<string> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        return "";
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          workspace: workspacePath,
          action: "diff",
        });
        if (file) params.append("file", file);
        if (staged) params.append("staged", "true");

        const response = await fetch(`/api/workspace/git?${params}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get diff");
        }

        const data = await response.json();
        return data.diff;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get diff";
        setError(message);
        return "";
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit]
  );

  /**
   * Get branches
   */
  const getBranches = useCallback(async (): Promise<GitBranch[]> => {
    if (!hasActiveProject || !workspacePath || !hasGit) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspace: workspacePath,
        action: "branches",
      });

      const response = await fetch(`/api/workspace/git?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get branches");
      }

      const data = await response.json();
      setBranches(data.branches);
      return data.branches;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get branches";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [hasActiveProject, workspacePath, hasGit]);

  /**
   * Add files to staging
   */
  const addFiles = useCallback(
    async (files: string[]): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "add",
            files,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add files");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return data.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add files";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  /**
   * Commit staged changes
   */
  const commit = useCallback(
    async (
      message: string,
      files?: string[]
    ): Promise<{ success: boolean; hash?: string }> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return { success: false };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "commit",
            message,
            files,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to commit");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return { success: data.success, hash: data.hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to commit";
        setError(message);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  /**
   * Push to remote
   */
  const push = useCallback(
    async (remote?: string, branch?: string): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "push",
            remote,
            branch,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to push");
        }

        const data = await response.json();
        return data.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to push";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit]
  );

  /**
   * Pull from remote
   */
  const pull = useCallback(
    async (remote?: string, branch?: string): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "pull",
            remote,
            branch,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to pull");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return data.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to pull";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  /**
   * Checkout branch
   */
  const checkout = useCallback(
    async (branch: string, create: boolean = false): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "checkout",
            branch,
            create,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to checkout");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return data.success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to checkout";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  /**
   * Stash changes
   */
  const stash = useCallback(
    async (pop: boolean = false, message?: string): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "stash",
            pop,
            message,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to stash");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return data.success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to stash";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  /**
   * Reset a file
   */
  const resetFile = useCallback(
    async (file: string): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath || !hasGit) {
        setError("No git repository");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            action: "reset",
            file,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to reset");
        }

        const data = await response.json();
        if (data.success) {
          await getStatus(); // Refresh status
        }
        return data.success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to reset";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, hasGit, getStatus]
  );

  return {
    status,
    branches,
    isLoading,
    error,
    getStatus,
    getLog,
    getDiff,
    getBranches,
    addFiles,
    commit,
    push,
    pull,
    checkout,
    stash,
    resetFile,
    isGitReady: hasActiveProject && hasGit,
    hasChanges: (status?.changes.length ?? 0) > 0,
    hasStagedChanges: (status?.staged ?? 0) > 0,
  };
}
