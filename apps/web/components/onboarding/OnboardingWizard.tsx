"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  useOnboardingStore,
  getOnboardingProgress,
  type OnboardingStep,
} from "@/lib/stores/onboarding-store";
import { WelcomeStep } from "./WelcomeStep";
import { APIKeysStep } from "./APIKeysStep";
import { PreferencesStep } from "./PreferencesStep";
import { GitHubStep } from "./GitHubStep";
import { CompleteStep } from "./CompleteStep";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const stepLabels: Record<OnboardingStep, string> = {
  welcome: "Welcome",
  api_keys: "API Keys",
  preferences: "Preferences",
  github: "GitHub",
  complete: "Complete",
};

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const router = useRouter();
  const store = useOnboardingStore();
  const { currentStep, completeStep, skipStep, completeOnboarding } = store;
  const progress = getOnboardingProgress(store);

  const handleContinue = () => {
    completeStep(currentStep);
  };

  const handleSkip = () => {
    skipStep(currentStep);
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ["welcome", "api_keys", "preferences", "github", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      store.setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    onOpenChange(false);
    router.push("/command-center");
  };

  const canGoBack = currentStep !== "welcome" && currentStep !== "complete";

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onContinue={handleContinue} />;
      case "api_keys":
        return <APIKeysStep onContinue={handleContinue} onSkip={handleSkip} />;
      case "preferences":
        return <PreferencesStep onContinue={handleContinue} onSkip={handleSkip} />;
      case "github":
        return <GitHubStep onContinue={handleContinue} onSkip={handleSkip} />;
      case "complete":
        return <CompleteStep onFinish={handleFinish} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0" hideCloseButton>
        {/* Header with progress */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {stepLabels[currentStep]}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {progress}% complete
            </span>
          </div>
          <Progress value={progress} className="mt-2 h-1" />
        </div>

        {/* Step content */}
        <div className="flex min-h-[500px] items-center justify-center p-8">
          {renderStep()}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 border-t py-4">
          {(["welcome", "api_keys", "preferences", "github", "complete"] as OnboardingStep[]).map(
            (step, index) => {
              const isCurrent = step === currentStep;
              const isCompleted = store.completedSteps.includes(step);
              return (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isCurrent
                      ? "bg-primary"
                      : isCompleted
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              );
            }
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
