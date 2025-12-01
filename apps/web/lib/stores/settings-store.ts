import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIProvider = "anthropic" | "google" | "both";
export type WorkflowPreset = "fast" | "balanced" | "thorough";
export type Theme = "light" | "dark" | "system";

export interface ModelConfig {
  orchestrator: string;
  worker: string;
  reviewer: string;
}

export interface UserSettings {
  // AI Model Preferences
  defaultProvider: AIProvider;
  anthropicModel: string;
  googleModel: string;
  modelConfig: ModelConfig;

  // Workflow Settings
  workflowPreset: WorkflowPreset;
  enableExtendedThinking: boolean;
  maxThinkingTokens: number;
  autoRetryOnError: boolean;
  maxRetries: number;

  // Code Generation
  defaultFramework: "react" | "vue" | "svelte" | "vanilla";
  includeTailwind: boolean;
  includeTypeScript: boolean;

  // Appearance
  theme: Theme;
  compactMode: boolean;
  showLineNumbers: boolean;

  // Notifications
  enableBrowserNotifications: boolean;
  enableEmailNotifications: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;

  // GitHub Integration
  githubConnected: boolean;
  githubUsername: string | null;
  defaultBranch: string;
  autoCreatePR: boolean;
}

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
  // AI Model Preferences
  defaultProvider: "anthropic",
  anthropicModel: "claude-sonnet-4-5-20250929",
  googleModel: "gemini-2.0-flash",
  modelConfig: {
    orchestrator: "claude-sonnet-4-5-20250929",
    worker: "claude-sonnet-4-5-20250929",
    reviewer: "claude-haiku-4-5-20251001",
  },

  // Workflow Settings
  workflowPreset: "balanced",
  enableExtendedThinking: true,
  maxThinkingTokens: 10000,
  autoRetryOnError: true,
  maxRetries: 3,

  // Code Generation
  defaultFramework: "react",
  includeTailwind: true,
  includeTypeScript: true,

  // Appearance
  theme: "dark",
  compactMode: false,
  showLineNumbers: true,

  // Notifications
  enableBrowserNotifications: true,
  enableEmailNotifications: false,
  notifyOnComplete: true,
  notifyOnError: true,

  // GitHub Integration
  githubConnected: false,
  githubUsername: null,
  defaultBranch: "main",
  autoCreatePR: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),
    }),
    {
      name: "chimera-settings",
    }
  )
);
