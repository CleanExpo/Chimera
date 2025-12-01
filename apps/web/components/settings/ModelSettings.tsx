"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore, type AIProvider } from "@/lib/stores/settings-store";
import { Bot, Brain, Cpu, Sparkles } from "lucide-react";

const anthropicModels = [
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", description: "Most capable, complex reasoning" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", description: "Best coding, balanced" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", description: "Fast, cost-efficient" },
];

const googleModels = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast, multimodal" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Best quality" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Balanced performance" },
];

export function ModelSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Model Preferences
        </CardTitle>
        <CardDescription>
          Configure which AI models to use for code generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Provider */}
        <div className="space-y-2">
          <Label htmlFor="provider">Default AI Provider</Label>
          <Select
            value={settings.defaultProvider}
            onValueChange={(value: AIProvider) => updateSettings({ defaultProvider: value })}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Anthropic (Claude)
                </div>
              </SelectItem>
              <SelectItem value="google">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Google (Gemini)
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Both (Parallel Generation)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {settings.defaultProvider === "both"
              ? "Generate with both providers and compare results"
              : `Use ${settings.defaultProvider === "anthropic" ? "Claude" : "Gemini"} as the primary model`}
          </p>
        </div>

        {/* Anthropic Model */}
        <div className="space-y-2">
          <Label htmlFor="anthropic-model">Anthropic Model</Label>
          <Select
            value={settings.anthropicModel}
            onValueChange={(value) => updateSettings({ anthropicModel: value })}
          >
            <SelectTrigger id="anthropic-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {anthropicModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Google Model */}
        <div className="space-y-2">
          <Label htmlFor="google-model">Google Model</Label>
          <Select
            value={settings.googleModel}
            onValueChange={(value) => updateSettings({ googleModel: value })}
          >
            <SelectTrigger id="google-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {googleModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Roles */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Model Role Assignment</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="orchestrator-model" className="text-sm">Orchestrator</Label>
              <Select
                value={settings.modelConfig.orchestrator}
                onValueChange={(value) =>
                  updateSettings({
                    modelConfig: { ...settings.modelConfig, orchestrator: value }
                  })
                }
              >
                <SelectTrigger id="orchestrator-model" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anthropicModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-model" className="text-sm">Worker</Label>
              <Select
                value={settings.modelConfig.worker}
                onValueChange={(value) =>
                  updateSettings({
                    modelConfig: { ...settings.modelConfig, worker: value }
                  })
                }
              >
                <SelectTrigger id="worker-model" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anthropicModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-model" className="text-sm">Reviewer</Label>
              <Select
                value={settings.modelConfig.reviewer}
                onValueChange={(value) =>
                  updateSettings({
                    modelConfig: { ...settings.modelConfig, reviewer: value }
                  })
                }
              >
                <SelectTrigger id="reviewer-model" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anthropicModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
