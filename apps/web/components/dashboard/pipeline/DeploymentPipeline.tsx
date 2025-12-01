"use client";

import { cn } from "@/lib/utils";
import {
  DeploymentPipelineState,
  PipelineStageId,
  DEFAULT_PIPELINE_STATE,
} from "@/lib/types/pipeline";
import { PipelineStageCard } from "./PipelineStage";
import { StageConnector } from "./StageConnector";
import { StatusLight } from "./StatusLight";
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeploymentPipelineProps {
  state?: DeploymentPipelineState;
  direction?: "horizontal" | "vertical";
  className?: string;
}

const healthConfig = {
  healthy: {
    label: "All Systems Operational",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  degraded: {
    label: "Degraded Performance",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  critical: {
    label: "Critical Issues",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

export function DeploymentPipeline({
  state = DEFAULT_PIPELINE_STATE,
  direction = "horizontal",
  className,
}: DeploymentPipelineProps) {
  const health = healthConfig[state.overallHealth];
  const HealthIcon = health.icon;

  // Find active transition between stages
  const getTransitionForStage = (fromId: PipelineStageId) => {
    if (!state.activeTransition) return undefined;
    return state.activeTransition.from === fromId
      ? state.activeTransition
      : undefined;
  };

  // Check if stage is currently active
  const isStageActive = (stageId: PipelineStageId) => {
    const stage = state.stages.find((s) => s.id === stageId);
    return stage?.status === "active" || stage?.status === "deploying";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Deployment Pipeline</h2>
        </div>

        {/* Health Status */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            health.bgColor
          )}
        >
          <HealthIcon className={cn("h-4 w-4", health.color)} />
          <span className={cn("text-sm font-medium", health.color)}>
            {health.label}
          </span>
        </div>
      </div>

      {/* Last Deployment Info */}
      {state.lastDeployment && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Last deployment:{" "}
            {formatDistanceToNow(state.lastDeployment, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Pipeline Stages */}
      {direction === "horizontal" ? (
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {state.stages.map((stage, index) => (
            <div key={stage.id} className="flex items-stretch">
              <div className="flex-shrink-0 w-[280px]">
                <PipelineStageCard
                  stage={stage}
                  isActive={isStageActive(stage.id)}
                />
              </div>
              {index < state.stages.length - 1 && (
                <StageConnector
                  transition={getTransitionForStage(stage.id)}
                  direction="horizontal"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {state.stages.map((stage, index) => (
            <div key={stage.id} className="flex flex-col items-stretch">
              <PipelineStageCard
                stage={stage}
                isActive={isStageActive(stage.id)}
              />
              {index < state.stages.length - 1 && (
                <div className="flex justify-center">
                  <StageConnector
                    transition={getTransitionForStage(stage.id)}
                    direction="vertical"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Transition Message */}
      {state.activeTransition && state.activeTransition.message && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
          <StatusLight status="active" size="sm" />
          <span>{state.activeTransition.message}</span>
        </div>
      )}
    </div>
  );
}

// Simplified mini view for dashboard cards
export function DeploymentPipelineMini({
  state = DEFAULT_PIPELINE_STATE,
  className,
}: Omit<DeploymentPipelineProps, "direction">) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Pipeline Status</span>
        <StatusLight status={state.overallHealth === "healthy" ? "success" : state.overallHealth === "degraded" ? "warning" : "error"} size="sm" showLabel />
      </div>

      {/* Inline stage indicators */}
      <div className="flex items-center gap-1">
        {state.stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-2 rounded-full transition-colors",
                stage.status === "success" && "bg-green-500",
                stage.status === "active" && "bg-blue-500 animate-pulse",
                stage.status === "error" && "bg-red-500",
                stage.status === "warning" && "bg-yellow-500",
                stage.status === "deploying" && "bg-purple-500 animate-pulse",
                stage.status === "idle" && "bg-muted"
              )}
              title={`${stage.name}: ${stage.statusMessage || stage.status}`}
            />
            {index < state.stages.length - 1 && (
              <div className="w-1 h-0.5 bg-muted-foreground/20" />
            )}
          </div>
        ))}
      </div>

      {/* Stage labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>DEV</span>
        <span>BUILD</span>
        <span>STAGE</span>
        <span>PROD</span>
      </div>
    </div>
  );
}
