"use client";

import { useEffect, useState } from "react";
import {
  useOnboardingStore,
  canUseApp,
  getOnboardingProgress,
} from "@/lib/stores/onboarding-store";

interface UseOnboardingReturn {
  /** Whether to show the onboarding wizard */
  showOnboarding: boolean;
  /** Set whether to show onboarding */
  setShowOnboarding: (show: boolean) => void;
  /** Whether onboarding has been completed */
  hasCompletedOnboarding: boolean;
  /** Whether minimum requirements are met to use the app */
  canUseApp: boolean;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Reset onboarding to start fresh */
  resetOnboarding: () => void;
}

/**
 * Hook for managing onboarding flow state
 */
export function useOnboarding(): UseOnboardingReturn {
  const store = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to complete before checking store
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show onboarding for new users after hydration
  useEffect(() => {
    if (mounted && !store.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [mounted, store.hasCompletedOnboarding]);

  return {
    showOnboarding: mounted ? showOnboarding : false,
    setShowOnboarding,
    hasCompletedOnboarding: store.hasCompletedOnboarding,
    canUseApp: canUseApp(store),
    progress: getOnboardingProgress(store),
    resetOnboarding: store.resetOnboarding,
  };
}
