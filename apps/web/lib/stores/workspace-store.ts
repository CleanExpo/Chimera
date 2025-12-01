/**
 * Workspace Store - Manages the active project being worked on
 *
 * Chimera acts as a visualization/orchestration layer that operates
 * ON external projects, keeping them completely isolated from Chimera itself.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  description?: string;
  framework?: string;
  language?: string;
  lastOpened: string;
  gitRemote?: string;
  gitBranch?: string;
}

export interface ProjectContext {
  // Structure
  hasPackageJson: boolean;
  hasGit: boolean;
  hasTsConfig: boolean;
  hasReadme: boolean;

  // Detected info
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  framework?: string;
  language?: "typescript" | "javascript" | "python" | "other";

  // File counts
  totalFiles: number;
  sourceFiles: number;

  // Dependencies
  dependencies: string[];
  devDependencies: string[];

  // Git status
  gitBranch?: string;
  gitRemote?: string;
  hasUncommittedChanges: boolean;

  // Entry points
  entryPoints: string[];

  // README summary (for AI context)
  readmeSummary?: string;
}

export interface WorkspaceState {
  // Active project
  activeProject: ProjectInfo | null;
  activeContext: ProjectContext | null;

  // Recent projects
  recentProjects: ProjectInfo[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveProject: (project: ProjectInfo | null) => void;
  setActiveContext: (context: ProjectContext | null) => void;
  addRecentProject: (project: ProjectInfo) => void;
  removeRecentProject: (projectId: string) => void;
  clearActiveProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeProject: null,
      activeContext: null,
      recentProjects: [],
      isLoading: false,
      error: null,

      setActiveProject: (project) => {
        set({ activeProject: project, error: null });

        // Add to recent projects if not null
        if (project) {
          const { recentProjects } = get();
          const filtered = recentProjects.filter((p) => p.id !== project.id);
          const updated = [
            { ...project, lastOpened: new Date().toISOString() },
            ...filtered,
          ].slice(0, 10); // Keep last 10
          set({ recentProjects: updated });
        }
      },

      setActiveContext: (context) => {
        set({ activeContext: context });
      },

      addRecentProject: (project) => {
        const { recentProjects } = get();
        const filtered = recentProjects.filter((p) => p.id !== project.id);
        set({
          recentProjects: [project, ...filtered].slice(0, 10),
        });
      },

      removeRecentProject: (projectId) => {
        const { recentProjects, activeProject } = get();
        set({
          recentProjects: recentProjects.filter((p) => p.id !== projectId),
          // Clear active if it was the removed one
          activeProject: activeProject?.id === projectId ? null : activeProject,
        });
      },

      clearActiveProject: () => {
        set({ activeProject: null, activeContext: null });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },
    }),
    {
      name: "chimera-workspace",
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        // Don't persist activeProject - user should explicitly open each session
      }),
    }
  )
);

/**
 * Generate a unique project ID from path
 */
export function generateProjectId(path: string): string {
  // Simple hash of the path
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `proj_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract project name from path
 */
export function getProjectNameFromPath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "Unknown Project";
}
