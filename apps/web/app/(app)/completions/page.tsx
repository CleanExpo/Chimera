"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  TrendingUp,
  BarChart3,
  FileCode,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useJobs, useJobMetrics } from "@/hooks/useJobs";
import type { OrchestrationJob } from "@/lib/api/jobs";

interface CompletedJob {
  id: string;
  title: string;
  brief: string;
  status: "success" | "partial" | "failed";
  framework: string;
  startedAt: string;
  completedAt: string;
  duration: number; // seconds
  tokensUsed: number;
  estimatedCost: number;
  teamsUsed: string[];
  approvedTeam?: "anthropic" | "google";
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  jobId?: string;
  details: string;
  category: "generation" | "approval" | "export" | "config" | "error";
}

// Mock data
const mockCompletions: CompletedJob[] = [
  {
    id: "job-1",
    title: "User Dashboard Component",
    brief: "Create a modern dashboard with metrics cards and charts",
    status: "success",
    framework: "react",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
    duration: 45,
    tokensUsed: 3420,
    estimatedCost: 0.01,
    teamsUsed: ["anthropic", "google"],
    approvedTeam: "anthropic",
  },
  {
    id: "job-2",
    title: "Navigation Menu",
    brief: "Build a responsive navigation with dropdown menus",
    status: "success",
    framework: "react",
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 38000).toISOString(),
    duration: 38,
    tokensUsed: 2850,
    estimatedCost: 0.009,
    teamsUsed: ["anthropic", "google"],
    approvedTeam: "google",
  },
  {
    id: "job-3",
    title: "Form Validation",
    brief: "Create a form with real-time validation",
    status: "partial",
    framework: "react",
    startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 52000).toISOString(),
    duration: 52,
    tokensUsed: 4100,
    estimatedCost: 0.012,
    teamsUsed: ["anthropic"],
    approvedTeam: "anthropic",
  },
];

const mockAudit: AuditEntry[] = [
  {
    id: "audit-1",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    action: "Job Approved",
    actor: "user",
    jobId: "job-1",
    details: "Approved Anthropic output for User Dashboard Component",
    category: "approval",
  },
  {
    id: "audit-2",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    action: "Code Exported",
    actor: "user",
    jobId: "job-1",
    details: "Exported as ZIP file",
    category: "export",
  },
  {
    id: "audit-3",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    action: "Generation Started",
    actor: "system",
    jobId: "job-1",
    details: "Dispatched to Anthropic and Google teams",
    category: "generation",
  },
];

const statusConfig = {
  success: { icon: CheckCircle, color: "text-green-500", label: "Success" },
  partial: { icon: Clock, color: "text-yellow-500", label: "Partial" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
};

const categoryColors = {
  generation: "bg-blue-500/10 text-blue-500",
  approval: "bg-green-500/10 text-green-500",
  export: "bg-purple-500/10 text-purple-500",
  config: "bg-yellow-500/10 text-yellow-500",
  error: "bg-red-500/10 text-red-500",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function CompletionCard({ job }: { job: CompletedJob }) {
  const status = statusConfig[job.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <StatusIcon className={cn("h-5 w-5 mt-0.5", status.color)} />
            <div>
              <h4 className="font-medium">{job.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {job.brief}
              </p>
            </div>
          </div>
          <Badge variant="outline">{job.framework}</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration</span>
            <p className="font-medium">{formatDuration(job.duration)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tokens</span>
            <p className="font-medium">{job.tokensUsed.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cost</span>
            <p className="font-medium">${job.estimatedCost.toFixed(3)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Approved</span>
            <p className="font-medium capitalize">{job.approvedTeam || "N/A"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {new Date(job.completedAt).toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Transform OrchestrationJob to CompletedJob format
function transformJob(job: OrchestrationJob): CompletedJob {
  const startTime = new Date(job.created_at).getTime();
  const endTime = job.completed_at
    ? new Date(job.completed_at).getTime()
    : Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Determine status based on job status
  let status: "success" | "partial" | "failed" = "success";
  if (job.status === "error") {
    status = "failed";
  } else if (job.status !== "complete") {
    status = "partial";
  }

  // Determine which teams were used and approved
  const teamsUsed: string[] = [];
  let approvedTeam: "anthropic" | "google" | undefined;
  if (job.teams.anthropic) {
    teamsUsed.push("anthropic");
    if (job.teams.anthropic.status === "complete") {
      approvedTeam = "anthropic";
    }
  }
  if (job.teams.google) {
    teamsUsed.push("google");
    if (job.teams.google.status === "complete" && !approvedTeam) {
      approvedTeam = "google";
    }
  }

  return {
    id: job.id,
    title: job.brief_summary || job.brief.slice(0, 50),
    brief: job.brief,
    status,
    framework: job.target_framework,
    startedAt: job.created_at,
    completedAt: job.completed_at || job.updated_at,
    duration,
    tokensUsed: job.total_tokens,
    estimatedCost: job.estimated_cost,
    teamsUsed,
    approvedTeam,
  };
}

export default function CompletionsPage() {
  const { jobs, loading: jobsLoading, error: jobsError, refresh } = useJobs({
    status: "complete",
    realtime: true,
  });
  const { metrics, loading: metricsLoading } = useJobMetrics();
  const [activeTab, setActiveTab] = useState("completions");
  const [audit] = useState<AuditEntry[]>(mockAudit); // Keep mock audit for now

  // Transform jobs to completions format, fallback to mock if no data
  const completions = useMemo(() => {
    if (jobs.length > 0) {
      return jobs.map(transformJob);
    }
    return mockCompletions;
  }, [jobs]);

  // Use real metrics if available, otherwise calculate from completions
  const totalJobs = metrics?.totalJobs ?? completions.length;
  const successRate = metrics?.successRate ??
    (completions.length > 0
      ? (completions.filter((c) => c.status === "success").length / completions.length) * 100
      : 0);
  const totalTokens = metrics?.totalTokens ?? completions.reduce((sum, c) => sum + c.tokensUsed, 0);
  const totalCost = metrics?.totalCost ?? completions.reduce((sum, c) => sum + c.estimatedCost, 0);
  const avgDuration = metrics?.avgDuration ??
    (completions.length > 0
      ? completions.reduce((sum, c) => sum + c.duration, 0) / completions.length
      : 0);

  const isLoading = jobsLoading || metricsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Completions & Audit
          </h1>
          <p className="text-muted-foreground">
            Review completed jobs, success metrics, and audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileCode className="h-4 w-4" />
              <span className="text-xs">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold">{totalJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {successRate.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold">
              {(totalTokens / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Total Cost</span>
            </div>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(Math.round(avgDuration))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="completions" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completions ({completions.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Audit Trail ({audit.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completions" className="mt-4">
          <div className="space-y-4">
            {completions.map((job) => (
              <CompletionCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {audit.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Badge className={cn("shrink-0", categoryColors[entry.category])}>
                        {entry.category}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.details}</p>
                        {entry.jobId && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Job: {entry.jobId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
