"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore, type Theme } from "@/lib/stores/settings-store";
import { Paintbrush, Sun, Moon, Monitor, Minimize2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const themes: { id: Theme; name: string; icon: React.ReactNode }[] = [
  { id: "light", name: "Light", icon: <Sun className="h-5 w-5" /> },
  { id: "dark", name: "Dark", icon: <Moon className="h-5 w-5" /> },
  { id: "system", name: "System", icon: <Monitor className="h-5 w-5" /> },
];

export function AppearanceSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize how Chimera looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  settings.theme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full",
                  settings.theme === theme.id ? "bg-primary/10" : "bg-muted"
                )}>
                  {theme.icon}
                </div>
                <span className="text-sm font-medium">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-start gap-3">
            <Minimize2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label htmlFor="compact">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce padding and spacing for more content
              </p>
            </div>
          </div>
          <Switch
            id="compact"
            checked={settings.compactMode}
            onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
          />
        </div>

        {/* Show Line Numbers */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-start gap-3">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label htmlFor="line-numbers">Show Line Numbers</Label>
              <p className="text-sm text-muted-foreground">
                Display line numbers in code editors
              </p>
            </div>
          </div>
          <Switch
            id="line-numbers"
            checked={settings.showLineNumbers}
            onCheckedChange={(checked) => updateSettings({ showLineNumbers: checked })}
          />
        </div>

        {/* Preview */}
        <div className="border-t pt-4 mt-4">
          <Label className="text-sm mb-3 block">Preview</Label>
          <div className={cn(
            "rounded-lg border overflow-hidden",
            settings.compactMode ? "text-sm" : "text-base"
          )}>
            <div className={cn(
              "bg-muted/50 border-b",
              settings.compactMode ? "px-2 py-1" : "px-4 py-2"
            )}>
              <span className="font-medium">example.tsx</span>
            </div>
            <div className={cn(
              "bg-zinc-950 font-mono text-zinc-300",
              settings.compactMode ? "p-2" : "p-4"
            )}>
              {settings.showLineNumbers ? (
                <div className="flex">
                  <div className="text-zinc-600 select-none pr-4 text-right">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                  </div>
                  <div>
                    <div>const greeting = "Hello";</div>
                    <div>const name = "World";</div>
                    <div>console.log(greeting, name);</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div>const greeting = "Hello";</div>
                  <div>const name = "World";</div>
                  <div>console.log(greeting, name);</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
