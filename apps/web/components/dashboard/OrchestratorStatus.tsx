"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Cpu, DollarSign } from "lucide-react";

export type OrchestratorState =
  | "idle"
  | "receiving_brief"
  | "planning"
  | "dispatching"
  | "awaiting_agents"
  | "synthesizing"
  | "complete";

interface OrchestratorStatusProps {
  state: OrchestratorState;
  activeTeams: string[];
  elapsedTime?: number;
  tokenCount?: number;
  estimatedCost?: number;
  currentTask?: string;
}

const stateConfig: Record<OrchestratorState, { label: string; color: string }> = {
  idle: { label: "Standing By", color: "bg-gray-400" },
  receiving_brief: { label: "Receiving Brief", color: "bg-blue-500 animate-pulse" },
  planning: { label: "Planning Strategy", color: "bg-yellow-500 animate-pulse" },
  dispatching: { label: "Dispatching Teams", color: "bg-purple-500 animate-pulse" },
  awaiting_agents: { label: "Awaiting Agents", color: "bg-orange-500 animate-pulse" },
  synthesizing: { label: "Synthesizing Results", color: "bg-cyan-500 animate-pulse" },
  complete: { label: "Complete", color: "bg-green-500" },
};

export function OrchestratorStatus({
  state,
  activeTeams,
  elapsedTime = 0,
  tokenCount = 0,
  estimatedCost = 0,
  currentTask,
}: OrchestratorStatusProps) {
  const stateInfo = stateConfig[state];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Orchestrator Anchor Desk
          </CardTitle>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <span className={`w-2 h-2 rounded-full ${stateInfo.color}`} />
            {stateInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Teams */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Active Teams</p>
              <p className="text-sm font-medium">
                {activeTeams.length > 0 ? activeTeams.join(", ") : "None"}
              </p>
            </div>
          </div>

          {/* Elapsed Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Elapsed</p>
              <p className="text-sm font-medium font-mono">
                {formatTime(elapsedTime)}
              </p>
            </div>
          </div>

          {/* Token Count */}
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tokens</p>
              <p className="text-sm font-medium">
                {tokenCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Cost</p>
              <p className="text-sm font-medium">
                ${estimatedCost.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Current Task */}
        {currentTask && (
          <div className="mt-4 p-3 rounded-md bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Current Task</p>
            <p className="text-sm">{currentTask}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrchestratorStatus;
