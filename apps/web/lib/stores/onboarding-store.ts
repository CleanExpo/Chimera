/**
 * Onboarding store for tracking user setup progress
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep =
  | "welcome"
  | "api_keys"
  | "preferences"
  | "github"
  | "complete";

export interface OnboardingState {
  // Current state
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];

  // Step-specific data
  apiKeysConfigured: {
    anthropic: boolean;
    google: boolean;
  };
  preferencesSet: boolean;
  githubConnected: boolean;

  // Skip tracking
  skippedSteps: OnboardingStep[];

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  skipStep: (step: OnboardingStep) => void;
  setApiKeyConfigured: (provider: "anthropic" | "google", configured: boolean) => void;
  setPreferencesSet: (set: boolean) => void;
  setGithubConnected: (connected: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState = {
  hasCompletedOnboarding: false,
  currentStep: "welcome" as OnboardingStep,
  completedSteps: [],
  apiKeysConfigured: {
    anthropic: false,
    google: false,
  },
  preferencesSet: false,
  githubConnected: false,
  skippedSteps: [],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      completeStep: (step) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }

        // Auto-advance to next step
        const steps: OnboardingStep[] = ["welcome", "api_keys", "preferences", "github", "complete"];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
          set({ currentStep: steps[currentIndex + 1] });
        }
      },

      skipStep: (step) => {
        const { skippedSteps, completedSteps } = get();
        if (!skippedSteps.includes(step)) {
          set({ skippedSteps: [...skippedSteps, step] });
        }

        // Treat skipped as completed for flow purposes
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }

        // Auto-advance to next step
        const steps: OnboardingStep[] = ["welcome", "api_keys", "preferences", "github", "complete"];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
          set({ currentStep: steps[currentIndex + 1] });
        }
      },

      setApiKeyConfigured: (provider, configured) => {
        set((state) => ({
          apiKeysConfigured: {
            ...state.apiKeysConfigured,
            [provider]: configured,
          },
        }));
      },

      setPreferencesSet: (preferencesSet) => {
        set({ preferencesSet });
      },

      setGithubConnected: (githubConnected) => {
        set({ githubConnected });
      },

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          currentStep: "complete",
        });
      },

      resetOnboarding: () => {
        set(initialState);
      },
    }),
    {
      name: "chimera-onboarding",
    }
  )
);

/**
 * Calculate onboarding progress percentage
 */
export function getOnboardingProgress(state: OnboardingState): number {
  const totalSteps = 4; // welcome, api_keys, preferences, github
  const completed = state.completedSteps.filter((s) => s !== "complete").length;
  return Math.round((completed / totalSteps) * 100);
}

/**
 * Check if minimum requirements are met to use the app
 */
export function canUseApp(state: OnboardingState): boolean {
  // At minimum, need at least one API key configured
  return state.apiKeysConfigured.anthropic || state.apiKeysConfigured.google;
}
