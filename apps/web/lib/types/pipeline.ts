/**
 * Deployment Pipeline Types
 *
 * Types for the visual deployment pipeline showing code progression
 * through Development → Build → Staging → Production
 */

export type PipelineStageId = "development" | "build" | "staging" | "production";

export type StageStatus =
  | "idle" // Gray - no activity
  | "active" // Blue pulsing - work in progress
  | "success" // Green - completed successfully
  | "warning" // Orange - attention needed
  | "error" // Red - failure
  | "deploying"; // Purple pulsing - deployment in progress

export interface StageMetadata {
  commitHash?: string;
  version?: string;
  buildNumber?: string;
  deployedBy?: string;
  duration?: number; // seconds
  url?: string; // Preview/production URL
}

export interface SubStep {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  message?: string;
}

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  description: string;
  status: StageStatus;
  statusMessage?: string;
  timestamp?: Date;
  metadata?: StageMetadata;
  subSteps?: SubStep[];
}

export interface DeploymentTransition {
  from: PipelineStageId;
  to: PipelineStageId;
  status: "idle" | "in_progress" | "complete" | "failed";
  progress?: number; // 0-100
  startedAt?: Date;
  message?: string;
}

export interface DeploymentPipelineState {
  stages: PipelineStage[];
  activeTransition?: DeploymentTransition;
  overallHealth: "healthy" | "degraded" | "critical";
  lastDeployment?: Date;
  nextScheduledDeployment?: Date;
}

// Stage configuration for consistent display
export const STAGE_CONFIG: Record<
  PipelineStageId,
  {
    name: string;
    shortName: string;
    description: string;
    color: string;
  }
> = {
  development: {
    name: "Development",
    shortName: "DEV",
    description: "Local development environment",
    color: "green",
  },
  build: {
    name: "Build",
    shortName: "BUILD",
    description: "Compilation and testing",
    color: "yellow",
  },
  staging: {
    name: "Staging",
    shortName: "STAGE",
    description: "Pre-production testing",
    color: "orange",
  },
  production: {
    name: "Production",
    shortName: "PROD",
    description: "Live environment",
    color: "blue",
  },
};

// Status display configuration
export const STATUS_CONFIG: Record<
  StageStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    glowColor: string;
    animate: boolean;
  }
> = {
  idle: {
    label: "Idle",
    color: "text-gray-400",
    bgColor: "bg-gray-400",
    glowColor: "",
    animate: false,
  },
  active: {
    label: "Active",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    glowColor: "shadow-blue-500/50",
    animate: true,
  },
  success: {
    label: "Success",
    color: "text-green-500",
    bgColor: "bg-green-500",
    glowColor: "shadow-green-500/50",
    animate: false,
  },
  warning: {
    label: "Warning",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
    glowColor: "shadow-yellow-500/50",
    animate: true,
  },
  error: {
    label: "Error",
    color: "text-red-500",
    bgColor: "bg-red-500",
    glowColor: "shadow-red-500/50",
    animate: false,
  },
  deploying: {
    label: "Deploying",
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    glowColor: "shadow-purple-500/50",
    animate: true,
  },
};

// Default/mock pipeline state for development
export const DEFAULT_PIPELINE_STATE: DeploymentPipelineState = {
  stages: [
    {
      id: "development",
      name: "Development",
      description: "Local development environment",
      status: "success",
      statusMessage: "Ready to deploy",
      timestamp: new Date(),
      metadata: {
        commitHash: "abc1234",
        version: "2.1.0",
      },
    },
    {
      id: "build",
      name: "Build",
      description: "Compilation and testing",
      status: "success",
      statusMessage: "All checks passed",
      timestamp: new Date(),
      metadata: {
        buildNumber: "142",
        duration: 45,
      },
      subSteps: [
        { id: "ts", name: "TypeScript", status: "passed" },
        { id: "lint", name: "Linting", status: "passed" },
        { id: "test", name: "Tests", status: "passed" },
      ],
    },
    {
      id: "staging",
      name: "Staging",
      description: "Pre-production testing",
      status: "active",
      statusMessage: "E2E tests running",
      timestamp: new Date(),
      metadata: {
        version: "2.1.0-rc.1",
        url: "https://staging.example.com",
      },
    },
    {
      id: "production",
      name: "Production",
      description: "Live environment",
      status: "success",
      statusMessage: "Healthy",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      metadata: {
        version: "2.0.9",
        url: "https://example.com",
      },
    },
  ],
  overallHealth: "healthy",
  lastDeployment: new Date(Date.now() - 86400000),
};
