"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, Bell, Zap, Shield } from "lucide-react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

interface PreferencesStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function PreferencesStep({ onContinue, onSkip }: PreferencesStepProps) {
  const { setPreferencesSet } = useOnboardingStore();
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [autoApprove, setAutoApprove] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selfHealingTier, setSelfHealingTier] = useState("1");

  const handleSave = () => {
    // In production, save these preferences to user settings
    setPreferencesSet(true);
    onContinue();
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Set Your Preferences</h2>
        <p className="mt-2 text-muted-foreground">
          Customize how Chimera works for you. You can change these anytime in Settings.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Default AI Model</CardTitle>
            </div>
            <CardDescription>
              Choose the model used for orchestration tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-opus">Claude Opus (Most capable)</SelectItem>
                <SelectItem value="claude-sonnet">Claude Sonnet (Balanced)</SelectItem>
                <SelectItem value="claude-haiku">Claude Haiku (Fastest)</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro (Alternative)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Self-Healing Autonomy</CardTitle>
            </div>
            <CardDescription>
              Maximum tier that can auto-fix without approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selfHealingTier} onValueChange={setSelfHealingTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None (All require approval)</SelectItem>
                <SelectItem value="1">Tier 1 (Container restarts, cache clearing)</SelectItem>
                <SelectItem value="2">Tier 2 (Config changes, scaling)</SelectItem>
                <SelectItem value="3">Tier 3 (All including database changes)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="notifications" className="text-base font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about job completions and approvals
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="auto-approve" className="text-base font-medium">
                    Auto-approve Low Risk
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve decisions with 95%+ confidence
                  </p>
                </div>
              </div>
              <Switch
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleSave}>Continue</Button>
      </div>
    </div>
  );
}
