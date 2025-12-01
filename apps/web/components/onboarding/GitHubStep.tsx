"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Check, ExternalLink, GitBranch, FolderGit2 } from "lucide-react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

interface GitHubStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function GitHubStep({ onContinue, onSkip }: GitHubStepProps) {
  const { githubConnected, setGithubConnected } = useOnboardingStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);

    // In production, this would initiate OAuth flow
    // For now, simulate connection
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setGithubConnected(true);
    setConnecting(false);
  };

  const benefits = [
    {
      icon: GitBranch,
      title: "Direct Push",
      description: "Push generated code directly to branches",
    },
    {
      icon: FolderGit2,
      title: "Repository Access",
      description: "Read existing code for context-aware generation",
    },
  ];

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Github className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Connect GitHub</h2>
        <p className="mt-2 text-muted-foreground">
          Enable seamless code export and repository integration
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">GitHub Account</CardTitle>
            {githubConnected && (
              <Badge variant="default" className="bg-green-600">
                <Check className="mr-1 h-3 w-3" /> Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Connect your GitHub account to enable code export
          </CardDescription>
        </CardHeader>
        <CardContent>
          {githubConnected ? (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">GitHub Connected</p>
                  <p className="text-sm text-muted-foreground">
                    You can now export code to your repositories
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              <Github className="mr-2 h-5 w-5" />
              {connecting ? "Connecting..." : "Connect GitHub Account"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-lg border bg-card p-4"
          >
            <benefit.icon className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-dashed bg-muted/30 p-4">
        <p className="text-center text-sm text-muted-foreground">
          Chimera only requests necessary permissions and never modifies your
          repositories without explicit approval.{" "}
          <a
            href="#"
            className="inline-flex items-center text-primary hover:underline"
          >
            Learn more <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={onContinue}>
          {githubConnected ? "Continue" : "Continue without GitHub"}
        </Button>
      </div>
    </div>
  );
}
