"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield, GitBranch } from "lucide-react";

interface WelcomeStepProps {
  onContinue: () => void;
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  const features = [
    {
      icon: Zap,
      title: "Multi-Agent Teams",
      description: "Claude & Gemini working in parallel for optimal results",
    },
    {
      icon: Sparkles,
      title: "Real-time Streaming",
      description: "Watch AI thoughts flow live as agents work on your tasks",
    },
    {
      icon: Shield,
      title: "Human-in-the-Loop",
      description: "Review and approve AI decisions before they're applied",
    },
    {
      icon: GitBranch,
      title: "GitHub Integration",
      description: "Export generated code directly to your repositories",
    },
  ];

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">Welcome to Chimera</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Your AI-powered Digital Command Center for autonomous development
        operations. Let&apos;s get you set up in just a few steps.
      </p>

      <div className="mb-8 grid w-full max-w-lg grid-cols-2 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border bg-card p-4 text-left"
          >
            <feature.icon className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onContinue} className="min-w-[200px]">
        Get Started
      </Button>
    </div>
  );
}
