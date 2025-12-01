"use client";

import { Sandpack, type SandpackFiles } from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";
import { Component, ReactNode } from "react";

interface CodePreviewProps {
  code: string;
  language?: "react" | "vanilla" | "vue" | "svelte";
  showEditor?: boolean;
  showConsole?: boolean;
  title?: string;
}

// Error boundary for handling malformed code
class CodePreviewErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("CodePreview error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Clean AI-generated code by:
 * - Removing markdown code fences
 * - Trimming whitespace
 * - Handling various code formats
 */
function cleanCode(code: string): string {
  let cleaned = code;

  // Remove markdown code fences (```jsx, ```javascript, ```react, etc.)
  cleaned = cleaned.replace(/^```[\w]*\n/gm, "");
  cleaned = cleaned.replace(/\n```$/gm, "");
  cleaned = cleaned.replace(/^```[\w]*\r?\n/g, "");
  cleaned = cleaned.replace(/\r?\n```$/g, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Detect if code has imports and extract them
 */
function extractImports(code: string): { imports: string; component: string } {
  const lines = code.split("\n");
  const importLines: string[] = [];
  const componentLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("import ")) {
      importLines.push(line);
    } else {
      componentLines.push(line);
    }
  }

  return {
    imports: importLines.join("\n"),
    component: componentLines.join("\n"),
  };
}

/**
 * Build Sandpack files based on framework and code
 */
function buildSandpackFiles(
  code: string,
  language: "react" | "vanilla" | "vue" | "svelte"
): SandpackFiles {
  const cleaned = cleanCode(code);

  switch (language) {
    case "react": {
      // Check if code has imports
      const { imports, component } = extractImports(cleaned);

      // If code looks like a full component with export default
      if (cleaned.includes("export default") || cleaned.includes("export function")) {
        return {
          "/App.js": cleaned,
        };
      }

      // If code has imports but no export, wrap it
      if (imports) {
        return {
          "/App.js": `${imports}\n\nexport default function App() {\n  return (\n    ${component}\n  );\n}`,
        };
      }

      // Plain JSX, wrap in component
      return {
        "/App.js": `export default function App() {\n  return (\n    ${cleaned}\n  );\n}`,
      };
    }

    case "vue":
      return {
        "/App.vue": cleaned.includes("<template>")
          ? cleaned
          : `<template>\n  ${cleaned}\n</template>`,
      };

    case "svelte":
      return {
        "/App.svelte": cleaned,
      };

    case "vanilla":
      return {
        "/index.js": cleaned,
      };

    default:
      return {
        "/App.js": cleaned,
      };
  }
}

export function CodePreview({
  code,
  language = "react",
  showEditor = true,
  showConsole = false,
  title,
}: CodePreviewProps) {
  // Validate code
  if (!code || code.trim() === "") {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {title && (
          <div className="px-4 py-2 border-b border-border bg-muted/50">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          </div>
        )}
        <div className="h-[350px] flex items-center justify-center bg-muted/30">
          <p className="text-sm text-muted-foreground">No code to preview</p>
        </div>
      </div>
    );
  }

  const files = buildSandpackFiles(code, language);

  // Get Sandpack template based on language
  const template = language === "react" ? "react" : language === "vue" ? "vue" : language === "svelte" ? "svelte" : "vanilla";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
      )}
      <CodePreviewErrorBoundary
        fallback={
          <div className="h-[350px] flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <div className="text-center p-4">
              <p className="text-sm font-medium text-red-500 mb-2">
                Failed to render preview
              </p>
              <p className="text-xs text-muted-foreground">
                The generated code may contain syntax errors
              </p>
            </div>
          </div>
        }
      >
        <Sandpack
          template={template}
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
      </CodePreviewErrorBoundary>
    </div>
  );
}

export default CodePreview;
