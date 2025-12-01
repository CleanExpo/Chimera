"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Code2, FileCode, Palette, FileType } from "lucide-react";

const frameworks = [
  { id: "react", name: "React", icon: "⚛️", description: "React with JSX" },
  { id: "vue", name: "Vue", icon: "💚", description: "Vue Single File Components" },
  { id: "svelte", name: "Svelte", icon: "🔥", description: "Svelte Components" },
  { id: "vanilla", name: "Vanilla JS", icon: "📦", description: "Plain JavaScript" },
];

export function CodeGenerationSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Code Generation
        </CardTitle>
        <CardDescription>
          Configure default options for generated code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Framework */}
        <div className="space-y-2">
          <Label htmlFor="framework">Default Framework</Label>
          <Select
            value={settings.defaultFramework}
            onValueChange={(value: "react" | "vue" | "svelte" | "vanilla") =>
              updateSettings({ defaultFramework: value })
            }
          >
            <SelectTrigger id="framework">
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((fw) => (
                <SelectItem key={fw.id} value={fw.id}>
                  <div className="flex items-center gap-2">
                    <span>{fw.icon}</span>
                    <div>
                      <div className="font-medium">{fw.name}</div>
                      <div className="text-xs text-muted-foreground">{fw.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Include Tailwind */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-start gap-3">
            <Palette className="h-5 w-5 text-cyan-500 mt-0.5" />
            <div>
              <Label htmlFor="tailwind">Include Tailwind CSS</Label>
              <p className="text-sm text-muted-foreground">
                Use Tailwind utility classes for styling
              </p>
            </div>
          </div>
          <Switch
            id="tailwind"
            checked={settings.includeTailwind}
            onCheckedChange={(checked) => updateSettings({ includeTailwind: checked })}
          />
        </div>

        {/* Include TypeScript */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-start gap-3">
            <FileType className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <Label htmlFor="typescript">Include TypeScript</Label>
              <p className="text-sm text-muted-foreground">
                Add type annotations to generated code
              </p>
            </div>
          </div>
          <Switch
            id="typescript"
            checked={settings.includeTypeScript}
            onCheckedChange={(checked) => updateSettings({ includeTypeScript: checked })}
          />
        </div>

        {/* Preview */}
        <div className="border-t pt-4 mt-4">
          <Label className="text-sm mb-2 block">Code Template Preview</Label>
          <div className="rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            {settings.defaultFramework === "react" && (
              <pre>{`${settings.includeTypeScript ? 'interface Props {\n  // props\n}\n\n' : ''}export default function Component(${settings.includeTypeScript ? 'props: Props' : 'props'}) {
  return (
    <div${settings.includeTailwind ? ' className="p-4"' : ''}>
      {/* Component content */}
    </div>
  );
}`}</pre>
            )}
            {settings.defaultFramework === "vue" && (
              <pre>{`<template>
  <div${settings.includeTailwind ? ' class="p-4"' : ''}>
    <!-- Component content -->
  </div>
</template>

<script${settings.includeTypeScript ? ' lang="ts"' : ''} setup>
// Component logic
</script>`}</pre>
            )}
            {settings.defaultFramework === "svelte" && (
              <pre>{`<script${settings.includeTypeScript ? ' lang="ts"' : ''}>
  // Component logic
</script>

<div${settings.includeTailwind ? ' class="p-4"' : ''}>
  <!-- Component content -->
</div>`}</pre>
            )}
            {settings.defaultFramework === "vanilla" && (
              <pre>{`${settings.includeTypeScript ? '// TypeScript enabled\n' : ''}const element = document.createElement('div');
${settings.includeTailwind ? "element.className = 'p-4';\n" : ''}// Component logic`}</pre>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
