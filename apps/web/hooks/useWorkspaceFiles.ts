"use client";

import { useState, useCallback } from "react";
import { useWorkspace } from "./useWorkspace";

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  modified: string;
}

interface UseWorkspaceFilesReturn {
  // State
  files: FileEntry[];
  currentPath: string;
  isLoading: boolean;
  error: string | null;

  // File Operations
  listFiles: (dirPath?: string) => Promise<FileEntry[]>;
  readFile: (filePath: string) => Promise<FileContent | null>;
  writeFile: (filePath: string, content: string, createDirs?: boolean) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  navigateTo: (dirPath: string) => Promise<void>;
  navigateUp: () => Promise<void>;

  // Helpers
  isWorkspaceReady: boolean;
  workspacePath: string;
}

/**
 * Hook for file operations within the active workspace
 */
export function useWorkspaceFiles(): UseWorkspaceFilesReturn {
  const { activeProject, hasActiveProject } = useWorkspace();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState(".");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspacePath = activeProject?.path || "";

  /**
   * List files in a directory
   */
  const listFiles = useCallback(
    async (dirPath: string = "."): Promise<FileEntry[]> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          workspace: workspacePath,
          path: dirPath,
          action: "list",
        });

        const response = await fetch(`/api/workspace/files?${params}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to list files");
        }

        const data = await response.json();
        setFiles(data.files);
        setCurrentPath(dirPath);
        return data.files;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to list files";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath]
  );

  /**
   * Read file contents
   */
  const readFile = useCallback(
    async (filePath: string): Promise<FileContent | null> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          workspace: workspacePath,
          path: filePath,
          action: "read",
        });

        const response = await fetch(`/api/workspace/files?${params}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to read file");
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to read file";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath]
  );

  /**
   * Write content to a file
   */
  const writeFile = useCallback(
    async (
      filePath: string,
      content: string,
      createDirs: boolean = true
    ): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/workspace/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: workspacePath,
            path: filePath,
            content,
            createDirs,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to write file");
        }

        // Refresh file list if in same directory
        const fileDir = filePath.includes("/")
          ? filePath.substring(0, filePath.lastIndexOf("/"))
          : ".";
        if (fileDir === currentPath || currentPath === ".") {
          await listFiles(currentPath);
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to write file";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, currentPath, listFiles]
  );

  /**
   * Delete a file
   */
  const deleteFile = useCallback(
    async (filePath: string): Promise<boolean> => {
      if (!hasActiveProject || !workspacePath) {
        setError("No active workspace");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          workspace: workspacePath,
          path: filePath,
        });

        const response = await fetch(`/api/workspace/files?${params}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete file");
        }

        // Refresh file list
        await listFiles(currentPath);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete file";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hasActiveProject, workspacePath, currentPath, listFiles]
  );

  /**
   * Navigate to a directory
   */
  const navigateTo = useCallback(
    async (dirPath: string): Promise<void> => {
      await listFiles(dirPath);
    },
    [listFiles]
  );

  /**
   * Navigate up one directory
   */
  const navigateUp = useCallback(async (): Promise<void> => {
    if (currentPath === "." || currentPath === "") {
      return;
    }

    const parentPath = currentPath.includes("/")
      ? currentPath.substring(0, currentPath.lastIndexOf("/")) || "."
      : ".";

    await listFiles(parentPath);
  }, [currentPath, listFiles]);

  return {
    files,
    currentPath,
    isLoading,
    error,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    navigateTo,
    navigateUp,
    isWorkspaceReady: hasActiveProject && !!workspacePath,
    workspacePath,
  };
}
