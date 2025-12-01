"use client";

import { cn } from "@/lib/utils";
import { DeploymentTransition } from "@/lib/types/pipeline";
import { ArrowRight, ArrowDown, Loader2 } from "lucide-react";

interface StageConnectorProps {
  transition?: DeploymentTransition;
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function StageConnector({
  transition,
  direction = "horizontal",
  className,
}: StageConnectorProps) {
  const isActive = transition?.status === "in_progress";
  const isComplete = transition?.status === "complete";
  const isFailed = transition?.status === "failed";

  if (direction === "vertical") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-2",
          className
        )}
      >
        {/* Connecting line */}
        <div
          className={cn(
            "w-0.5 h-8 relative overflow-hidden",
            isComplete && "bg-green-500",
            isActive && "bg-blue-500",
            isFailed && "bg-red-500",
            !transition && "bg-muted-foreground/20"
          )}
        >
          {/* Animated flow indicator */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-flow-down" />
          )}
        </div>

        {/* Arrow or progress indicator */}
        <div
          className={cn(
            "my-1 p-1 rounded-full",
            isComplete && "bg-green-500/20 text-green-500",
            isActive && "bg-blue-500/20 text-blue-500",
            isFailed && "bg-red-500/20 text-red-500",
            !transition && "text-muted-foreground/40"
          )}
        >
          {isActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </div>

        {/* Lower connecting line */}
        <div
          className={cn(
            "w-0.5 h-8 relative overflow-hidden",
            isComplete && "bg-green-500",
            isActive && "bg-muted-foreground/20",
            isFailed && "bg-muted-foreground/20",
            !transition && "bg-muted-foreground/20"
          )}
        />

        {/* Progress percentage */}
        {isActive && transition?.progress !== undefined && (
          <span className="text-xs text-blue-500 font-medium mt-1">
            {transition.progress}%
          </span>
        )}
      </div>
    );
  }

  // Horizontal connector
  return (
    <div
      className={cn(
        "flex items-center justify-center px-2 min-w-[60px]",
        className
      )}
    >
      {/* Left line segment */}
      <div
        className={cn(
          "h-0.5 flex-1 relative overflow-hidden",
          isComplete && "bg-green-500",
          isActive && "bg-blue-500",
          isFailed && "bg-red-500",
          !transition && "bg-muted-foreground/20"
        )}
      >
        {/* Animated flow indicator */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-flow-right" />
        )}
      </div>

      {/* Arrow or progress indicator */}
      <div
        className={cn(
          "mx-1 p-1 rounded-full flex-shrink-0",
          isComplete && "bg-green-500/20 text-green-500",
          isActive && "bg-blue-500/20 text-blue-500",
          isFailed && "bg-red-500/20 text-red-500",
          !transition && "text-muted-foreground/40"
        )}
      >
        {isActive ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </div>

      {/* Right line segment */}
      <div
        className={cn(
          "h-0.5 flex-1",
          isComplete && "bg-green-500",
          isActive && "bg-muted-foreground/20",
          isFailed && "bg-muted-foreground/20",
          !transition && "bg-muted-foreground/20"
        )}
      />

      {/* Progress percentage (for horizontal, shown below) */}
      {isActive && transition?.progress !== undefined && (
        <span className="absolute -bottom-5 text-xs text-blue-500 font-medium">
          {transition.progress}%
        </span>
      )}
    </div>
  );
}

// Minimal connector for compact view
export function StageConnectorCompact({
  isComplete = false,
  isActive = false,
  className,
}: {
  isComplete?: boolean;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center px-1", className)}>
      <div
        className={cn(
          "h-0.5 w-4 transition-colors",
          isComplete && "bg-green-500",
          isActive && "bg-blue-500 animate-pulse",
          !isComplete && !isActive && "bg-muted-foreground/20"
        )}
      />
      <ArrowRight
        className={cn(
          "h-3 w-3",
          isComplete && "text-green-500",
          isActive && "text-blue-500",
          !isComplete && !isActive && "text-muted-foreground/30"
        )}
      />
    </div>
  );
}
