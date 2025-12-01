"use client";

import { cn } from "@/lib/utils";
import { StageStatus, STATUS_CONFIG } from "@/lib/types/pipeline";

interface StatusLightProps {
  status: StageStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

const glowSizes = {
  sm: "shadow-[0_0_8px_2px]",
  md: "shadow-[0_0_12px_3px]",
  lg: "shadow-[0_0_16px_4px]",
};

export function StatusLight({
  status,
  size = "md",
  showLabel = false,
  className,
}: StatusLightProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full",
          sizeClasses[size],
          config.bgColor,
          config.animate && "animate-pulse",
          // Glow effect
          config.glowColor && glowSizes[size],
          config.glowColor
        )}
        role="status"
        aria-label={config.label}
      />
      {showLabel && (
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Beacon variant with outer ring animation
export function StatusBeacon({
  status,
  size = "md",
  className,
}: Omit<StatusLightProps, "showLabel">) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={cn("relative", className)}>
      {/* Outer pulsing ring */}
      {config.animate && (
        <div
          className={cn(
            "absolute inset-0 rounded-full opacity-50",
            config.bgColor,
            "animate-ping"
          )}
        />
      )}
      {/* Inner solid light */}
      <div
        className={cn(
          "relative rounded-full",
          sizeClasses[size],
          config.bgColor,
          config.glowColor && glowSizes[size],
          config.glowColor
        )}
        role="status"
        aria-label={config.label}
      />
    </div>
  );
}
