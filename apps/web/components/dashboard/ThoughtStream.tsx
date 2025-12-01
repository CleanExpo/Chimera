"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain,
  Lightbulb,
  Code2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface Thought {
  id: string;
  text: string;
  timestamp: string;
  source: "anthropic" | "google" | "planner" | "reviewer" | "refiner";
}

interface ThoughtStreamProps {
  thoughts: Thought[];
  isStreaming?: boolean;
  maxHeight?: string;
  showTimestamps?: boolean;
  className?: string;
}

const sourceConfig = {
  anthropic: {
    icon: Brain,
    label: "Claude",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    dotColor: "bg-orange-500",
  },
  google: {
    icon: Sparkles,
    label: "Gemini",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  planner: {
    icon: Lightbulb,
    label: "Planner",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  reviewer: {
    icon: CheckCircle,
    label: "Reviewer",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    dotColor: "bg-green-500",
  },
  refiner: {
    icon: Code2,
    label: "Refiner",
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    dotColor: "bg-cyan-500",
  },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ThoughtStream({
  thoughts,
  isStreaming = false,
  maxHeight = "300px",
  showTimestamps = true,
  className,
}: ThoughtStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thoughts.length]);

  if (thoughts.length === 0 && !isStreaming) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground py-8",
          className
        )}
      >
        <div className="text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Waiting for agent thoughts...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn("pr-4", className)}
      style={{ maxHeight }}
    >
      <div className="space-y-3">
        {thoughts.map((thought, index) => {
          const config = sourceConfig[thought.source] || sourceConfig.planner;
          const Icon = config.icon;
          const isLatest = index === thoughts.length - 1;

          return (
            <div
              key={thought.id}
              className={cn(
                "flex gap-3 p-3 rounded-lg border transition-all duration-300",
                isLatest && isStreaming
                  ? "bg-primary/5 border-primary/20 animate-pulse"
                  : "bg-card border-border"
              )}
            >
              {/* Source indicator */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                  {showTimestamps && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(thought.timestamp)}
                    </span>
                  )}
                  {isLatest && isStreaming && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {thought.text}
                </p>
              </div>
            </div>
          );
        })}

        {/* Streaming indicator */}
        {isStreaming && thoughts.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">Thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

// Compact version for sidebar/small displays
export function ThoughtStreamCompact({
  thoughts,
  isStreaming = false,
  maxItems = 5,
  className,
}: {
  thoughts: Thought[];
  isStreaming?: boolean;
  maxItems?: number;
  className?: string;
}) {
  const recentThoughts = thoughts.slice(-maxItems);

  return (
    <div className={cn("space-y-2", className)}>
      {recentThoughts.map((thought, index) => {
        const config = sourceConfig[thought.source] || sourceConfig.planner;
        const isLatest = index === recentThoughts.length - 1;

        return (
          <div
            key={thought.id}
            className={cn(
              "flex items-start gap-2 text-xs",
              isLatest && isStreaming && "animate-pulse"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", config.dotColor)} />
            <p className="text-muted-foreground line-clamp-2">{thought.text}</p>
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}
