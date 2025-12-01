"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Pause,
  ArrowRight,
} from "lucide-react";

export type WorkItemStatus = "queued" | "running" | "complete" | "error" | "paused";

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  status: WorkItemStatus;
  startTime?: string;
  endTime?: string;
  duration?: number; // in seconds
  agent?: string;
  phase?: string;
}

interface WorkTimelineProps {
  items: WorkItem[];
  className?: string;
}

const statusConfig: Record<WorkItemStatus, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  queued: {
    icon: Clock,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Queued",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Running",
  },
  complete: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Complete",
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Error",
  },
  paused: {
    icon: Pause,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Paused",
  },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function TimelineItem({ item, isLast }: { item: WorkItem; isLast: boolean }) {
  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 w-0.5 h-full bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2",
          config.bgColor,
          item.status === "running" ? "border-blue-500" : "border-border"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            config.color,
            item.status === "running" && "animate-spin"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn("shrink-0", config.color)}>
            {config.label}
          </Badge>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {item.agent && (
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {item.agent}
            </span>
          )}
          {item.phase && (
            <Badge variant="secondary" className="text-xs">
              {item.phase}
            </Badge>
          )}
          {item.startTime && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {new Date(item.startTime).toLocaleTimeString()}
            </span>
          )}
          {item.duration !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkTimeline({ items, className }: WorkTimelineProps) {
  const runningItems = items.filter((i) => i.status === "running");
  const completedItems = items.filter((i) => i.status === "complete");

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Timeline
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{runningItems.length} running</span>
            <span>|</span>
            <span>{completedItems.length} completed</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No work in progress</p>
            <p className="text-sm">Timeline will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-0">
              {items.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  isLast={index === items.length - 1}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
