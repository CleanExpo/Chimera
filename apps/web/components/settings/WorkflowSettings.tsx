"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useSettingsStore, type WorkflowPreset } from "@/lib/stores/settings-store";
import { Workflow, Zap, Scale, Target, RefreshCw } from "lucide-react";

const workflowPresets = [
  {
    id: "fast",
    name: "Fast",
    description: "Quick generation with minimal review",
    icon: Zap,
    steps: ["PLAN", "GENERATE", "COMPLETE"],
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Standard workflow with one review cycle",
    icon: Scale,
    steps: ["PLAN", "GENERATE", "REVIEW", "COMPLETE"],
  },
  {
    id: "thorough",
    name: "Thorough",
    description: "Full workflow with refinement loop",
    icon: Target,
    steps: ["PLAN", "GENERATE", "REVIEW", "REFINE", "COMPLETE"],
  },
];

export function WorkflowSettings() {
  const { settings, updateSettings } = useSettingsStore();

  const selectedPreset = workflowPresets.find(p => p.id === settings.workflowPreset);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Workflow Configuration
        </CardTitle>
        <CardDescription>
          Configure how the AI generation workflow operates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Preset */}
        <div className="space-y-2">
          <Label>Workflow Preset</Label>
          <Select
            value={settings.workflowPreset}
            onValueChange={(value: WorkflowPreset) => updateSettings({ workflowPreset: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {workflowPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    <preset.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workflow Steps Visualization */}
        {selectedPreset && (
          <div className="p-4 rounded-lg bg-muted/50 border">
            <Label className="text-sm mb-2 block">Workflow Steps</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedPreset.steps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm font-medium">
                    {step}
                  </div>
                  {index < selectedPreset.steps.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extended Thinking */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="extended-thinking">Extended Thinking</Label>
            <p className="text-sm text-muted-foreground">
              Allow Claude to think longer for complex tasks
            </p>
          </div>
          <Switch
            id="extended-thinking"
            checked={settings.enableExtendedThinking}
            onCheckedChange={(checked) => updateSettings({ enableExtendedThinking: checked })}
          />
        </div>

        {/* Max Thinking Tokens */}
        {settings.enableExtendedThinking && (
          <div className="space-y-2">
            <Label htmlFor="thinking-tokens">Max Thinking Tokens</Label>
            <Input
              id="thinking-tokens"
              type="number"
              min={1000}
              max={50000}
              step={1000}
              value={settings.maxThinkingTokens}
              onChange={(e) => updateSettings({ maxThinkingTokens: parseInt(e.target.value) || 10000 })}
            />
            <p className="text-sm text-muted-foreground">
              Higher values allow more thorough reasoning (1,000 - 50,000)
            </p>
          </div>
        )}

        {/* Error Handling */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Error Handling
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-retry">Auto-Retry on Error</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically retry failed generations
                </p>
              </div>
              <Switch
                id="auto-retry"
                checked={settings.autoRetryOnError}
                onCheckedChange={(checked) => updateSettings({ autoRetryOnError: checked })}
              />
            </div>

            {settings.autoRetryOnError && (
              <div className="space-y-2">
                <Label htmlFor="max-retries">Max Retries</Label>
                <Select
                  value={settings.maxRetries.toString()}
                  onValueChange={(value) => updateSettings({ maxRetries: parseInt(value) })}
                >
                  <SelectTrigger id="max-retries">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="2">2 retries</SelectItem>
                    <SelectItem value="3">3 retries</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
