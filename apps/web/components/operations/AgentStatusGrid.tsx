"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bot,
  Sparkles,
  Brain,
  Search,
  Code2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

export type AgentStatus = "idle" | "active" | "complete" | "error" | "waiting";

export interface Agent {
  id: string;
  name: string;
  type: "orchestrator" | "planner" | "generator" | "reviewer" | "refiner";
  provider?: "anthropic" | "google";
  status: AgentStatus;
  currentTask?: string;
  tokensUsed?: number;
  startTime?: string;
}

interface AgentStatusGridProps {
  agents: Agent[];
  className?: string;
}

const agentConfig = {
  orchestrator: {
    icon: Brain,
    color: "bg-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  planner: {
    icon: Search,
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  generator: {
    icon: Code2,
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  reviewer: {
    icon: CheckCircle,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  refiner: {
    icon: RefreshCw,
    color: "bg-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
};

const statusConfig = {
  idle: { label: "Idle", color: "bg-gray-400", textColor: "text-gray-400" },
  active: { label: "Active", color: "bg-green-500 animate-pulse", textColor: "text-green-500" },
  complete: { label: "Complete", color: "bg-blue-500", textColor: "text-blue-500" },
  error: { label: "Error", color: "bg-red-500", textColor: "text-red-500" },
  waiting: { label: "Waiting", color: "bg-yellow-500", textColor: "text-yellow-500" },
};

function AgentCard({ agent }: { agent: Agent }) {
  const config = agentConfig[agent.type];
  const status = statusConfig[agent.status];
  const Icon = config.icon;
  const ProviderIcon = agent.provider === "google" ? Sparkles : Bot;

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300",
        config.bgColor,
        config.borderColor,
        agent.status === "active" && "ring-2 ring-primary/30 shadow-lg"
      )}
    >
      {/* Status indicator */}
      <div className={cn("absolute top-2 right-2 w-3 h-3 rounded-full", status.color)} />

      {/* Agent icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", config.color, "text-white")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{agent.name}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {agent.provider && <ProviderIcon className="h-3 w-3" />}
            <span className={status.textColor}>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {agent.currentTask}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {agent.tokensUsed !== undefined && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {agent.tokensUsed.toLocaleString()}
          </div>
        )}
        {agent.startTime && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(agent.startTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentStatusGrid({ agents, className }: AgentStatusGridProps) {
  const activeAgents = agents.filter((a) => a.status === "active");
  const idleAgents = agents.filter((a) => a.status === "idle");
  const completedAgents = agents.filter((a) => a.status === "complete");

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              {activeAgents.length} Active
            </Badge>
            <Badge variant="secondary">{idleAgents.length} Idle</Badge>
            <Badge variant="outline">{completedAgents.length} Done</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No agents active</p>
            <p className="text-sm">Submit a brief to start orchestration</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
