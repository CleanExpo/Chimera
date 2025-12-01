"use client";

import { Sandpack } from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";

interface CodePreviewProps {
  code: string;
  language?: "react" | "vanilla" | "vue" | "svelte";
  showEditor?: boolean;
  showConsole?: boolean;
  title?: string;
}

export function CodePreview({
  code,
  language = "react",
  showEditor = true,
  showConsole = false,
  title,
}: CodePreviewProps) {
  const files: Record<string, string> =
    language === "react"
      ? {
          "/App.js": code,
        }
      : {
          "/index.js": code,
        };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
      )}
      <Sandpack
        template={language === "react" ? "react" : "vanilla"}
        theme={nightOwl}
        files={files}
        options={{
          showTabs: false,
          showLineNumbers: true,
          editorHeight: 350,
          showConsole: showConsole,
          showConsoleButton: showConsole,
          editorWidthPercentage: showEditor ? 50 : 0,
        }}
      />
    </div>
  );
}

export default CodePreview;
