"use client";

import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Code2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Circle,
  Loader2,
} from "lucide-react";

export type WorkflowPhase =
  | "initialized"
  | "planning"
  | "generating"
  | "reviewing"
  | "refining"
  | "complete"
  | "error";

interface WorkflowProgressProps {
  currentPhase: WorkflowPhase;
  refinementIteration?: number;
  maxRefinements?: number;
  className?: string;
}

const phases = [
  { id: "planning", label: "Plan", icon: Lightbulb },
  { id: "generating", label: "Generate", icon: Code2 },
  { id: "reviewing", label: "Review", icon: Search },
  { id: "refining", label: "Refine", icon: RefreshCw },
  { id: "complete", label: "Complete", icon: CheckCircle },
] as const;

function getPhaseIndex(phase: WorkflowPhase): number {
  if (phase === "initialized") return -1;
  if (phase === "error") return -2;
  return phases.findIndex((p) => p.id === phase);
}

function getPhaseStatus(
  phaseId: string,
  currentPhase: WorkflowPhase
): "pending" | "active" | "complete" | "error" {
  if (currentPhase === "error") return "error";

  const currentIndex = getPhaseIndex(currentPhase);
  const phaseIndex = phases.findIndex((p) => p.id === phaseId);

  if (phaseIndex < currentIndex) return "complete";
  if (phaseIndex === currentIndex) return "active";
  return "pending";
}

export function WorkflowProgress({
  currentPhase,
  refinementIteration = 0,
  maxRefinements = 2,
  className,
}: WorkflowProgressProps) {
  const progress =
    currentPhase === "error"
      ? 0
      : currentPhase === "complete"
      ? 100
      : ((getPhaseIndex(currentPhase) + 1) / phases.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              currentPhase === "error" ? "bg-red-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phase steps */}
      <div className="flex justify-between">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id, currentPhase);
          const Icon = phase.icon;

          return (
            <div
              key={phase.id}
              className="flex flex-col items-center gap-1"
            >
              {/* Icon circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  status === "complete" &&
                    "bg-primary border-primary text-primary-foreground",
                  status === "active" &&
                    "bg-primary/10 border-primary text-primary animate-pulse",
                  status === "pending" &&
                    "bg-muted border-muted-foreground/20 text-muted-foreground",
                  status === "error" &&
                    "bg-red-500/10 border-red-500 text-red-500"
                )}
              >
                {status === "active" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : status === "complete" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : status === "error" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium",
                  status === "active" && "text-primary",
                  status === "complete" && "text-foreground",
                  status === "pending" && "text-muted-foreground",
                  status === "error" && "text-red-500"
                )}
              >
                {phase.label}
              </span>

              {/* Refinement indicator */}
              {phase.id === "refining" && refinementIteration > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {refinementIteration}/{maxRefinements}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current phase description */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {currentPhase === "initialized" && "Waiting to start..."}
          {currentPhase === "planning" && "Analyzing requirements and creating implementation plan"}
          {currentPhase === "generating" && "Claude & Gemini generating code in parallel"}
          {currentPhase === "reviewing" && "Reviewing generated code for quality"}
          {currentPhase === "refining" && `Refining code based on review (iteration ${refinementIteration})`}
          {currentPhase === "complete" && "Workflow completed successfully"}
          {currentPhase === "error" && "An error occurred during processing"}
        </p>
      </div>
    </div>
  );
}

// Compact horizontal version
export function WorkflowProgressCompact({
  currentPhase,
  className,
}: {
  currentPhase: WorkflowPhase;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {phases.map((phase, index) => {
        const status = getPhaseStatus(phase.id, currentPhase);
        const Icon = phase.icon;
        const isLast = index === phases.length - 1;

        return (
          <div key={phase.id} className="flex items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                status === "complete" && "bg-primary text-primary-foreground",
                status === "active" && "bg-primary/20 text-primary",
                status === "pending" && "bg-muted text-muted-foreground",
                status === "error" && "bg-red-500/20 text-red-500"
              )}
            >
              {status === "active" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
            </div>
            {!isLast && (
              <div
                className={cn(
                  "w-4 h-0.5 mx-1",
                  status === "complete" ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
