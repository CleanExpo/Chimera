"use client";

import { useCallback, useState } from "react";
import {
  useWorkspaceStore,
  generateProjectId,
  getProjectNameFromPath,
  type ProjectInfo,
  type ProjectContext,
} from "@/lib/stores/workspace-store";

interface UseWorkspaceReturn {
  // State
  activeProject: ProjectInfo | null;
  activeContext: ProjectContext | null;
  recentProjects: ProjectInfo[];
  isLoading: boolean;
  error: string | null;

  // Actions
  openProject: (projectPath: string) => Promise<boolean>;
  closeProject: () => void;
  refreshContext: () => Promise<void>;
  removeFromRecent: (projectId: string) => void;

  // Helpers
  hasActiveProject: boolean;
  projectName: string;
  projectPath: string;
}

/**
 * Hook for managing the workspace - the external project being worked on
 */
export function useWorkspace(): UseWorkspaceReturn {
  const store = useWorkspaceStore();
  const [localLoading, setLocalLoading] = useState(false);

  /**
   * Open a project by path - analyzes it and sets as active
   */
  const openProject = useCallback(async (projectPath: string): Promise<boolean> => {
    try {
      setLocalLoading(true);
      store.setLoading(true);
      store.setError(null);

      // Analyze the project
      const response = await fetch("/api/workspace/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze project");
      }

      const analysis = await response.json();

      if (!analysis.exists) {
        store.setError(analysis.error || "Project directory not found");
        return false;
      }

      // Create project info
      const project: ProjectInfo = {
        id: generateProjectId(analysis.path),
        name: analysis.name,
        path: analysis.path,
        description: analysis.readmeSummary?.slice(0, 100),
        framework: analysis.framework,
        language: analysis.language,
        lastOpened: new Date().toISOString(),
        gitRemote: analysis.gitRemote,
        gitBranch: analysis.gitBranch,
      };

      // Create context
      const context: ProjectContext = {
        hasPackageJson: analysis.hasPackageJson,
        hasGit: analysis.hasGit,
        hasTsConfig: analysis.hasTsConfig,
        hasReadme: analysis.hasReadme,
        packageManager: analysis.packageManager,
        framework: analysis.framework,
        language: analysis.language,
        totalFiles: analysis.totalFiles,
        sourceFiles: analysis.sourceFiles,
        dependencies: analysis.dependencies,
        devDependencies: analysis.devDependencies,
        gitBranch: analysis.gitBranch,
        gitRemote: analysis.gitRemote,
        hasUncommittedChanges: analysis.hasUncommittedChanges,
        entryPoints: analysis.entryPoints,
        readmeSummary: analysis.readmeSummary,
      };

      store.setActiveProject(project);
      store.setActiveContext(context);
      store.setLoading(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open project";
      store.setError(message);
      return false;
    } finally {
      setLocalLoading(false);
      store.setLoading(false);
    }
  }, [store]);

  /**
   * Close the active project
   */
  const closeProject = useCallback(() => {
    store.clearActiveProject();
  }, [store]);

  /**
   * Refresh the context of the active project
   */
  const refreshContext = useCallback(async () => {
    if (!store.activeProject) return;
    await openProject(store.activeProject.path);
  }, [store.activeProject, openProject]);

  /**
   * Remove a project from recent list
   */
  const removeFromRecent = useCallback((projectId: string) => {
    store.removeRecentProject(projectId);
  }, [store]);

  return {
    activeProject: store.activeProject,
    activeContext: store.activeContext,
    recentProjects: store.recentProjects,
    isLoading: store.isLoading || localLoading,
    error: store.error,

    openProject,
    closeProject,
    refreshContext,
    removeFromRecent,

    hasActiveProject: !!store.activeProject,
    projectName: store.activeProject?.name || "No Project",
    projectPath: store.activeProject?.path || "",
  };
}
