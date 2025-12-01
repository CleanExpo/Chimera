"use client";

import { cn } from "@/lib/utils";
import {
  DeploymentPipelineState,
  STAGE_CONFIG,
  DEFAULT_PIPELINE_STATE,
} from "@/lib/types/pipeline";
import { StatusBeacon } from "./StatusLight";
import { StageConnectorCompact } from "./StageConnector";
import { Code2, Hammer, FlaskConical, Rocket, ChevronRight } from "lucide-react";

interface DeploymentPipelineCompactProps {
  state?: DeploymentPipelineState;
  onExpand?: () => void;
  className?: string;
}

const stageIcons = {
  development: Code2,
  build: Hammer,
  staging: FlaskConical,
  production: Rocket,
};

export function DeploymentPipelineCompact({
  state = DEFAULT_PIPELINE_STATE,
  onExpand,
  className,
}: DeploymentPipelineCompactProps) {
  // Find current stage index for progress calculation
  const currentStageIndex = state.stages.findIndex(
    (s) => s.status === "active" || s.status === "deploying"
  );
  const lastSuccessIndex = state.stages.reduce((acc, stage, idx) => {
    return stage.status === "success" ? idx : acc;
  }, -1);

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-2 rounded-lg bg-card border",
        className
      )}
    >
      {/* Pipeline stages inline */}
      {state.stages.map((stage, index) => {
        const config = STAGE_CONFIG[stage.id];
        const Icon = stageIcons[stage.id];
        const isComplete = stage.status === "success";
        const isActive =
          stage.status === "active" || stage.status === "deploying";
        const isPast = index <= lastSuccessIndex;

        return (
          <div key={stage.id} className="flex items-center">
            {/* Stage indicator */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                isActive && "bg-blue-500/10",
                stage.status === "error" && "bg-red-500/10",
                stage.status === "warning" && "bg-yellow-500/10"
              )}
              title={`${stage.name}: ${stage.statusMessage || stage.status}`}
            >
              <StatusBeacon status={stage.status} size="sm" />
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isComplete && "text-green-500",
                  isActive && "text-blue-500",
                  stage.status === "error" && "text-red-500",
                  stage.status === "warning" && "text-yellow-500",
                  stage.status === "idle" && "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isComplete && "text-green-500",
                  isActive && "text-blue-500",
                  stage.status === "error" && "text-red-500",
                  stage.status === "warning" && "text-yellow-500",
                  stage.status === "idle" && "text-muted-foreground"
                )}
              >
                {config.shortName}
              </span>
            </div>

            {/* Connector */}
            {index < state.stages.length - 1 && (
              <StageConnectorCompact
                isComplete={isPast && index < lastSuccessIndex}
                isActive={index === currentStageIndex}
              />
            )}
          </div>
        );
      })}

      {/* Expand button */}
      {onExpand && (
        <button
          onClick={onExpand}
          className="ml-2 p-1 rounded hover:bg-muted transition-colors"
          title="Expand pipeline view"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// Ultra-compact version for very tight spaces
export function DeploymentPipelineStrip({
  state = DEFAULT_PIPELINE_STATE,
  className,
}: Omit<DeploymentPipelineCompactProps, "onExpand">) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {state.stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center">
          <div
            className={cn(
              "w-6 h-1.5 rounded-full transition-colors",
              stage.status === "success" && "bg-green-500",
              stage.status === "active" && "bg-blue-500 animate-pulse",
              stage.status === "error" && "bg-red-500",
              stage.status === "warning" && "bg-yellow-500",
              stage.status === "deploying" && "bg-purple-500 animate-pulse",
              stage.status === "idle" && "bg-muted-foreground/20"
            )}
            title={`${stage.name}: ${stage.status}`}
          />
          {index < state.stages.length - 1 && (
            <div className="w-0.5 h-1 bg-muted-foreground/10" />
          )}
        </div>
      ))}
    </div>
  );
}
