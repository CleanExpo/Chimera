"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AgentStatusGrid,
  WorkTimeline,
  HealthIndicators,
  type Agent,
  type WorkItem,
  type ServiceStatus,
} from "@/components/operations";
import {
  Activity,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";

// Mock data - in production, this would come from the backend
const mockAgents: Agent[] = [
  {
    id: "orch-1",
    name: "Orchestrator",
    type: "orchestrator",
    status: "idle",
    tokensUsed: 0,
  },
  {
    id: "plan-1",
    name: "Planner",
    type: "planner",
    provider: "anthropic",
    status: "idle",
    tokensUsed: 0,
  },
  {
    id: "gen-anthropic",
    name: "Claude Generator",
    type: "generator",
    provider: "anthropic",
    status: "idle",
    tokensUsed: 0,
  },
  {
    id: "gen-google",
    name: "Gemini Generator",
    type: "generator",
    provider: "google",
    status: "idle",
    tokensUsed: 0,
  },
  {
    id: "review-1",
    name: "Code Reviewer",
    type: "reviewer",
    provider: "anthropic",
    status: "idle",
    tokensUsed: 0,
  },
  {
    id: "refine-1",
    name: "Code Refiner",
    type: "refiner",
    provider: "anthropic",
    status: "idle",
    tokensUsed: 0,
  },
];

const mockWorkItems: WorkItem[] = [];

const mockServices: ServiceStatus[] = [
  {
    id: "backend-api",
    name: "Backend API",
    type: "api",
    health: "healthy",
    latency: 45,
    uptime: 99.98,
    lastCheck: new Date().toISOString(),
  },
  {
    id: "supabase",
    name: "Supabase Database",
    type: "database",
    health: "healthy",
    latency: 23,
    uptime: 99.99,
    lastCheck: new Date().toISOString(),
  },
  {
    id: "anthropic-api",
    name: "Anthropic API",
    type: "ai",
    health: "healthy",
    latency: 890,
    uptime: 99.95,
    lastCheck: new Date().toISOString(),
  },
  {
    id: "google-ai",
    name: "Google AI API",
    type: "ai",
    health: "healthy",
    latency: 650,
    uptime: 99.90,
    lastCheck: new Date().toISOString(),
  },
  {
    id: "websocket",
    name: "WebSocket Server",
    type: "websocket",
    health: "healthy",
    latency: 12,
    uptime: 99.97,
    lastCheck: new Date().toISOString(),
  },
];

interface OperationsMetrics {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  totalTokensToday: number;
  estimatedCostToday: number;
  avgResponseTime: number;
}

export default function OperationsPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [workItems, setWorkItems] = useState<WorkItem[]>(mockWorkItems);
  const [services, setServices] = useState<ServiceStatus[]>(mockServices);
  const [metrics, setMetrics] = useState<OperationsMetrics>({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    totalTokensToday: 0,
    estimatedCostToday: 0,
    avgResponseTime: 0,
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch operations data
  const fetchOperationsData = async () => {
    setIsRefreshing(true);
    try {
      // In production, fetch from backend
      // const response = await fetch('/api/operations/status');
      // const data = await response.json();

      // For now, use mock data with simulated values
      setMetrics({
        totalJobs: 156,
        activeJobs: 2,
        completedToday: 23,
        totalTokensToday: 245680,
        estimatedCostToday: 0.74,
        avgResponseTime: 4.2,
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch operations data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOperationsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchOperationsData();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Operations Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor system health, active agents, and resource usage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Active Now</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {metrics.activeJobs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Today</span>
            </div>
            <p className="text-2xl font-bold">{metrics.completedToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Tokens Today</span>
            </div>
            <p className="text-2xl font-bold">
              {(metrics.totalTokensToday / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Cost Today</span>
            </div>
            <p className="text-2xl font-bold">
              ${metrics.estimatedCostToday.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg Response</span>
            </div>
            <p className="text-2xl font-bold">{metrics.avgResponseTime}s</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AgentStatusGrid agents={agents} />
        </div>

        {/* Health Indicators */}
        <div className="lg:col-span-1">
          <HealthIndicators services={services} />
        </div>
      </div>

      {/* Work Timeline - Full width */}
      <WorkTimeline items={workItems} />
    </div>
  );
}
