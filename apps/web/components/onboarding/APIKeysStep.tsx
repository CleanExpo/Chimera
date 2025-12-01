"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Key, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

interface APIKeysStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function APIKeysStep({ onContinue, onSkip }: APIKeysStepProps) {
  const { apiKeysConfigured, setApiKeyConfigured } = useOnboardingStore();
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveKeys = async () => {
    setSaving(true);

    // Simulate saving keys (in production, this would call an API)
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (anthropicKey.startsWith("sk-ant-")) {
      setApiKeyConfigured("anthropic", true);
    }
    if (googleKey.startsWith("AI")) {
      setApiKeyConfigured("google", true);
    }

    setSaving(false);
  };

  const canContinue = apiKeysConfigured.anthropic || apiKeysConfigured.google;

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Configure API Keys</h2>
        <p className="mt-2 text-muted-foreground">
          Add at least one API key to enable AI capabilities. Keys are stored
          securely and never shared.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Anthropic (Claude)</CardTitle>
              {apiKeysConfigured.anthropic && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="mr-1 h-3 w-3" /> Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Powers the orchestrator and primary AI tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">API Key</Label>
              <div className="relative">
                <Input
                  id="anthropic-key"
                  type={showAnthropic ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                >
                  {showAnthropic ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-muted-foreground hover:text-primary"
              >
                Get an API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Google AI (Gemini)</CardTitle>
              {apiKeysConfigured.google && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="mr-1 h-3 w-3" /> Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Powers Team Google for parallel generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="google-key">API Key</Label>
              <div className="relative">
                <Input
                  id="google-key"
                  type={showGoogle ? "text" : "password"}
                  placeholder="AI..."
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowGoogle(!showGoogle)}
                >
                  {showGoogle ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-muted-foreground hover:text-primary"
              >
                Get an API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <div className="space-x-2">
          {(anthropicKey || googleKey) && (
            <Button variant="outline" onClick={handleSaveKeys} disabled={saving}>
              {saving ? "Saving..." : "Save Keys"}
            </Button>
          )}
          <Button onClick={onContinue} disabled={!canContinue}>
            Continue
          </Button>
        </div>
      </div>

      {!canContinue && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Configure at least one API key to continue, or skip for now
        </p>
      )}
    </div>
  );
}
