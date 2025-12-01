"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Sparkles, Zap } from "lucide-react";
import { CodePreview } from "./CodePreview";

export type TeamType = "anthropic" | "google";
export type ChannelStatus = "idle" | "thinking" | "generating" | "complete" | "error";

interface ThoughtItem {
  id: string;
  text: string;
  timestamp: Date;
}

interface TeamChannelProps {
  team: TeamType;
  status: ChannelStatus;
  thoughts: ThoughtItem[];
  generatedCode?: string;
  modelName?: string;
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

const statusConfig: Record<ChannelStatus, { label: string; color: string }> = {
  idle: { label: "Standing By", color: "bg-gray-400" },
  thinking: { label: "Analyzing Brief...", color: "bg-yellow-500 animate-pulse" },
  generating: { label: "Generating Code", color: "bg-blue-500 animate-pulse" },
  complete: { label: "Complete", color: "bg-green-500" },
  error: { label: "Error", color: "bg-red-500" },
};

export function TeamChannel({
  team,
  status,
  thoughts,
  generatedCode,
  modelName,
}: TeamChannelProps) {
  const config = teamConfig[team];
  const statusInfo = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.name}
          </CardTitle>
          <Badge variant={config.badgeVariant} className="text-xs">
            {modelName || config.defaultModel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
          <span className="text-sm text-muted-foreground">{statusInfo.label}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Thought Stream */}
        <div className="flex-shrink-0">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Thought Stream
          </h4>
          <ScrollArea className="h-[120px] rounded-md border bg-muted/30 p-3">
            {thoughts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Waiting for brief...
              </p>
            ) : (
              <div className="space-y-2">
                {thoughts.map((thought) => (
                  <div key={thought.id} className="text-sm">
                    <span className="text-muted-foreground mr-2">›</span>
                    {thought.text}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Live Preview */}
        <div className="flex-1 min-h-0">
          <h4 className="text-sm font-medium mb-2">Live Shot</h4>
          {generatedCode ? (
            <CodePreview
              code={generatedCode}
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
