"use client";

import { cn } from "@/lib/utils";
import {
  PipelineStage as PipelineStageType,
  STAGE_CONFIG,
  STATUS_CONFIG,
} from "@/lib/types/pipeline";
import { StatusBeacon } from "./StatusLight";
import {
  Code2,
  Hammer,
  FlaskConical,
  Rocket,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Loader2,
  MinusCircle,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface PipelineStageProps {
  stage: PipelineStageType;
  isActive?: boolean;
  className?: string;
}

const stageIcons = {
  development: Code2,
  build: Hammer,
  staging: FlaskConical,
  production: Rocket,
};

const subStepIcons = {
  passed: CheckCircle,
  failed: XCircle,
  running: Loader2,
  pending: MinusCircle,
  skipped: MinusCircle,
};

export function PipelineStageCard({
  stage,
  isActive = false,
  className,
}: PipelineStageProps) {
  const [expanded, setExpanded] = useState(false);
  const config = STAGE_CONFIG[stage.id];
  const statusConfig = STATUS_CONFIG[stage.status];
  const Icon = stageIcons[stage.id];
  const hasSubSteps = stage.subSteps && stage.subSteps.length > 0;

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card transition-all duration-300",
        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        statusConfig.animate && "animate-pulse",
        className
      )}
    >
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side: Icon, name, description */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                stage.status === "success" && "bg-green-500/10 text-green-500",
                stage.status === "active" && "bg-blue-500/10 text-blue-500",
                stage.status === "error" && "bg-red-500/10 text-red-500",
                stage.status === "warning" && "bg-yellow-500/10 text-yellow-500",
                stage.status === "deploying" && "bg-purple-500/10 text-purple-500",
                stage.status === "idle" && "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{stage.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {config.shortName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stage.description}
              </p>
            </div>
          </div>

          {/* Right side: Status light */}
          <div className="flex items-center gap-3">
            <StatusBeacon status={stage.status} size="lg" />
          </div>
        </div>

        {/* Status message */}
        {stage.statusMessage && (
          <div
            className={cn(
              "mt-3 text-sm px-3 py-2 rounded-md",
              stage.status === "success" && "bg-green-500/10 text-green-600",
              stage.status === "active" && "bg-blue-500/10 text-blue-600",
              stage.status === "error" && "bg-red-500/10 text-red-600",
              stage.status === "warning" && "bg-yellow-500/10 text-yellow-600",
              stage.status === "deploying" && "bg-purple-500/10 text-purple-600",
              stage.status === "idle" && "bg-muted text-muted-foreground"
            )}
          >
            {stage.statusMessage}
          </div>
        )}

        {/* Metadata row */}
        {stage.metadata && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {stage.metadata.version && (
              <span className="flex items-center gap-1">
                <span className="font-medium">v{stage.metadata.version}</span>
              </span>
            )}
            {stage.metadata.commitHash && (
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {stage.metadata.commitHash.slice(0, 7)}
              </span>
            )}
            {stage.metadata.buildNumber && (
              <span>Build #{stage.metadata.buildNumber}</span>
            )}
            {stage.metadata.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stage.metadata.duration}s
              </span>
            )}
            {stage.metadata.url && (
              <a
                href={stage.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Preview
              </a>
            )}
          </div>
        )}

        {/* Timestamp */}
        {stage.timestamp && (
          <div className="mt-2 text-xs text-muted-foreground">
            {formatDistanceToNow(stage.timestamp, { addSuffix: true })}
          </div>
        )}

        {/* Expand/collapse for substeps */}
        {hasSubSteps && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show {stage.subSteps!.length} steps
              </>
            )}
          </button>
        )}
      </div>

      {/* Substeps panel */}
      {hasSubSteps && expanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-2">
          {stage.subSteps!.map((step) => {
            const StepIcon = subStepIcons[step.status];
            return (
              <div
                key={step.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <StepIcon
                    className={cn(
                      "h-4 w-4",
                      step.status === "passed" && "text-green-500",
                      step.status === "failed" && "text-red-500",
                      step.status === "running" && "text-blue-500 animate-spin",
                      step.status === "pending" && "text-muted-foreground",
                      step.status === "skipped" && "text-muted-foreground"
                    )}
                  />
                  <span>{step.name}</span>
                </div>
                {step.duration && (
                  <span className="text-xs text-muted-foreground">
                    {step.duration}s
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact horizontal stage indicator
export function PipelineStageCompact({
  stage,
  className,
}: PipelineStageProps) {
  const config = STAGE_CONFIG[stage.id];
  const Icon = stageIcons[stage.id];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border",
        stage.status === "success" && "bg-green-500/10 border-green-500/30",
        stage.status === "active" && "bg-blue-500/10 border-blue-500/30",
        stage.status === "error" && "bg-red-500/10 border-red-500/30",
        stage.status === "warning" && "bg-yellow-500/10 border-yellow-500/30",
        stage.status === "deploying" && "bg-purple-500/10 border-purple-500/30",
        stage.status === "idle" && "bg-muted border-muted-foreground/20",
        className
      )}
    >
      <StatusBeacon status={stage.status} size="sm" />
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{config.shortName}</span>
    </div>
  );
}
