"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface APIKey {
  name: string;
  envVar: string;
  provider: string;
  configured: boolean;
}

const apiKeys: APIKey[] = [
  { name: "Anthropic API Key", envVar: "ANTHROPIC_API_KEY", provider: "Claude", configured: false },
  { name: "Google AI API Key", envVar: "GOOGLE_AI_API_KEY", provider: "Gemini", configured: false },
  { name: "OpenRouter API Key", envVar: "OPENROUTER_API_KEY", provider: "OpenRouter", configured: false },
  { name: "Supabase URL", envVar: "NEXT_PUBLIC_SUPABASE_URL", provider: "Supabase", configured: false },
  { name: "Supabase Anon Key", envVar: "NEXT_PUBLIC_SUPABASE_ANON_KEY", provider: "Supabase", configured: false },
];

export function APIKeySettings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (envVar: string) => {
    setShowKeys((prev) => ({ ...prev, [envVar]: !prev[envVar] }));
  };

  // Check which keys are configured (simplified check)
  const configuredKeys = apiKeys.map((key) => ({
    ...key,
    configured: typeof window !== "undefined" &&
      key.envVar.startsWith("NEXT_PUBLIC_") &&
      !!process.env[key.envVar],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          API keys are configured via environment variables for security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Security Notice</p>
              <p className="text-sm text-muted-foreground">
                API keys should be set in your <code className="bg-muted px-1 rounded">.env.local</code> file,
                not in the browser. This panel shows configuration status only.
              </p>
            </div>
          </div>
        </div>

        {/* API Key Status */}
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.envVar}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-medium">{key.name}</span>
                  <code className="text-xs text-muted-foreground">{key.envVar}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={key.envVar.startsWith("NEXT_PUBLIC_") ? "default" : "secondary"}>
                  {key.provider}
                </Badge>
                {key.envVar.startsWith("NEXT_PUBLIC_") ? (
                  process.env[key.envVar] ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )
                ) : (
                  <Badge variant="outline">Server-side</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-2">How to configure</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Create a <code className="bg-muted px-1 rounded">.env.local</code> file in the project root</li>
            <li>Add your API keys as environment variables</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
