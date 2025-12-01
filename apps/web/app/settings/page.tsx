"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ModelSettings,
  WorkflowSettings,
  CodeGenerationSettings,
  AppearanceSettings,
  NotificationSettings,
  GitHubSettings,
  APIKeySettings,
} from "@/components/settings";
import { useSettingsStore } from "@/lib/stores/settings-store";
import {
  Settings,
  Brain,
  Workflow,
  Code2,
  Paintbrush,
  Bell,
  Github,
  Key,
  RotateCcw,
  Save,
} from "lucide-react";

const tabs = [
  { id: "models", label: "AI Models", icon: Brain },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "code", label: "Code Gen", icon: Code2 },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "github", label: "GitHub", icon: Github },
  { id: "api-keys", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("models");
  const { resetSettings } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Settings are auto-saved via zustand persist
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      resetSettings();
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure Chimera to work the way you want
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 shrink-0">
          <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-muted"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="pr-4 space-y-6">
              <TabsContent value="models" className="mt-0">
                <ModelSettings />
              </TabsContent>

              <TabsContent value="workflow" className="mt-0">
                <WorkflowSettings />
              </TabsContent>

              <TabsContent value="code" className="mt-0">
                <CodeGenerationSettings />
              </TabsContent>

              <TabsContent value="appearance" className="mt-0">
                <AppearanceSettings />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="github" className="mt-0">
                <GitHubSettings />
              </TabsContent>

              <TabsContent value="api-keys" className="mt-0">
                <APIKeySettings />
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
