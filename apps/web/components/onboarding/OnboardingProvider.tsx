"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWizard } from "./OnboardingWizard";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that shows onboarding wizard for new users
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { showOnboarding, setShowOnboarding } = useOnboarding();

  return (
    <>
      {children}
      <OnboardingWizard open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
}
