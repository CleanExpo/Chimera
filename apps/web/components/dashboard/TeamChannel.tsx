"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Zap, Clock, Cpu, AlertCircle } from "lucide-react";
import { CodePreview } from "./CodePreview";
import { ThoughtStreamCompact, type Thought } from "./ThoughtStream";
import { cn } from "@/lib/utils";

export type TeamType = "anthropic" | "google";
export type ChannelStatus = "idle" | "pending" | "thinking" | "generating" | "complete" | "error";

interface ThoughtItem {
  id: string;
  text: string;
  timestamp: Date | string;
  source?: string;
}

interface TeamChannelProps {
  team: TeamType;
  status: ChannelStatus;
  thoughts: ThoughtItem[];
  generatedCode?: string;
  modelName?: string;
  framework?: "react" | "vanilla" | "vue" | "svelte";
  tokenCount?: number;
  errorMessage?: string;
  isStreaming?: boolean;
}

const teamConfig = {
  anthropic: {
    name: "Team Anthropic",
    icon: Bot,
    color: "bg-orange-500",
    badgeVariant: "default" as const,
    defaultModel: "Claude Sonnet 4.5",
  },
  google: {
    name: "Team Google",
    icon: Sparkles,
    color: "bg-blue-500",
    badgeVariant: "secondary" as const,
    defaultModel: "Gemini 2.0 Flash",
  },
};

const statusConfig: Record<ChannelStatus, { label: string; color: string; bgColor: string }> = {
  idle: { label: "Standing By", color: "bg-gray-400", bgColor: "bg-gray-400/10" },
  pending: { label: "Queued", color: "bg-gray-400", bgColor: "bg-gray-400/10" },
  thinking: { label: "Analyzing Brief...", color: "bg-yellow-500 animate-pulse", bgColor: "bg-yellow-500/10" },
  generating: { label: "Generating Code", color: "bg-blue-500 animate-pulse", bgColor: "bg-blue-500/10" },
  complete: { label: "Complete", color: "bg-green-500", bgColor: "bg-green-500/10" },
  error: { label: "Error", color: "bg-red-500", bgColor: "bg-red-500/10" },
};

export function TeamChannel({
  team,
  status,
  thoughts,
  generatedCode,
  modelName,
  framework = "react",
  tokenCount = 0,
  errorMessage,
  isStreaming = false,
}: TeamChannelProps) {
  const config = teamConfig[team];
  const statusInfo = statusConfig[status];
  const Icon = config.icon;

  // Convert thoughts to the format expected by ThoughtStreamCompact
  const formattedThoughts: Thought[] = thoughts.map((t) => ({
    id: t.id,
    text: t.text,
    timestamp: typeof t.timestamp === "string" ? t.timestamp : t.timestamp.toISOString(),
    source: (t.source as Thought["source"]) || team,
  }));

  const isActive = status === "thinking" || status === "generating";

  return (
    <Card className={cn(
      "h-full flex flex-col transition-all duration-300",
      isActive && "ring-2 ring-primary/20"
    )}>
      <CardHeader className={cn("pb-3 transition-colors", statusInfo.bgColor)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              team === "anthropic" ? "bg-orange-500/20" : "bg-blue-500/20"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            {config.name}
          </CardTitle>
          <Badge variant={config.badgeVariant} className="text-xs">
            {modelName || config.defaultModel}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", statusInfo.color)} />
            <span className="text-sm text-muted-foreground">{statusInfo.label}</span>
          </div>
          {tokenCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3" />
              {tokenCount.toLocaleString()} tokens
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Error Message */}
        {status === "error" && errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        )}

        {/* Thought Stream */}
        <div className="flex-shrink-0">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Thought Stream
          </h4>
          <div className="rounded-md border bg-muted/30 p-3 min-h-[100px]">
            {thoughts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Waiting for brief...
              </p>
            ) : (
              <ThoughtStreamCompact
                thoughts={formattedThoughts}
                isStreaming={isActive || isStreaming}
                maxItems={5}
              />
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 min-h-0">
          <h4 className="text-sm font-medium mb-2">Live Shot</h4>
          {status === "generating" && !generatedCode ? (
            <div className="h-full min-h-[200px] rounded-md border bg-muted/30 flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
                  <Icon className="absolute inset-0 m-auto h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Generating code...
                </p>
              </div>
            </div>
          ) : generatedCode ? (
            <CodePreview
              code={generatedCode}
              language={framework}
              showEditor={false}
              title={`${config.name} Output`}
            />
          ) : (
            <div className="h-full min-h-[200px] rounded-md border bg-muted/30 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Preview will appear here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamChannel;
