"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Key, Settings2, Github, Rocket, ArrowRight } from "lucide-react";
import { useOnboardingStore, canUseApp } from "@/lib/stores/onboarding-store";

interface CompleteStepProps {
  onFinish: () => void;
}

export function CompleteStep({ onFinish }: CompleteStepProps) {
  const store = useOnboardingStore();
  const isReady = canUseApp(store);

  const steps = [
    {
      icon: Key,
      title: "API Keys",
      completed: store.apiKeysConfigured.anthropic || store.apiKeysConfigured.google,
      skipped: store.skippedSteps.includes("api_keys"),
      detail: store.apiKeysConfigured.anthropic && store.apiKeysConfigured.google
        ? "Both providers configured"
        : store.apiKeysConfigured.anthropic
        ? "Anthropic configured"
        : store.apiKeysConfigured.google
        ? "Google configured"
        : "Not configured",
    },
    {
      icon: Settings2,
      title: "Preferences",
      completed: store.preferencesSet,
      skipped: store.skippedSteps.includes("preferences"),
      detail: store.preferencesSet ? "Customized" : "Using defaults",
    },
    {
      icon: Github,
      title: "GitHub",
      completed: store.githubConnected,
      skipped: store.skippedSteps.includes("github"),
      detail: store.githubConnected ? "Connected" : "Not connected",
    },
  ];

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
      </div>

      <h1 className="mb-2 text-3xl font-bold">You&apos;re All Set!</h1>
      <p className="mb-8 text-muted-foreground">
        {isReady
          ? "Chimera is ready to power your development workflow."
          : "Configure at least one API key to start using Chimera."}
      </p>

      <div className="mb-8 space-y-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step.completed
                    ? "bg-green-500/10 text-green-600"
                    : step.skipped
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </div>
            <Badge
              variant={step.completed ? "default" : step.skipped ? "secondary" : "outline"}
              className={step.completed ? "bg-green-600" : ""}
            >
              {step.completed ? "Done" : step.skipped ? "Skipped" : "Pending"}
            </Badge>
          </div>
        ))}
      </div>

      {!isReady && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            You need at least one API key configured to use Chimera. You can add
            keys in Settings anytime.
          </p>
        </div>
      )}

      <Button
        size="lg"
        onClick={onFinish}
        className="min-w-[200px]"
        disabled={!isReady}
      >
        <Rocket className="mr-2 h-5 w-5" />
        Launch Command Center
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {!isReady && (
        <p className="mt-4 text-sm text-muted-foreground">
          Go to{" "}
          <a href="/settings" className="text-primary hover:underline">
            Settings
          </a>{" "}
          to configure your API keys
        </p>
      )}
    </div>
  );
}
