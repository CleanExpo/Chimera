"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Github,
  Copy,
  ExternalLink,
  Coins,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SandpackProvider, SandpackPreview, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { PageSkeleton } from "@/components/ui/skeleton-cards";
import { ErrorBoundary } from "@/components/error";
import { useJobAudit } from "@/hooks/useAudit";
import { toast } from "sonner";

interface TeamOutput {
  status: string;
  thoughts: string[];
  code: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

interface Job {
  id: string;
  title: string;
  brief: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  teams_used: string[];
  outputs: Record<string, TeamOutput>;
  selected_team: string | null;
  selected_output: TeamOutput | null;
  token_usage: { input: number; output: number; total: number };
  cost_usd: number;
  duration_ms: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// Mock job data for demo
const mockJob: Job = {
  id: "job-123",
  title: "Create Dashboard Analytics Component",
  brief: "Build a responsive analytics dashboard with charts showing user engagement metrics, conversion rates, and revenue trends.",
  status: "completed",
  teams_used: ["anthropic", "google"],
  outputs: {
    anthropic: {
      status: "completed",
      thoughts: [
        "Analyzing the requirements for analytics dashboard...",
        "Planning component structure with Chart.js integration...",
        "Implementing responsive grid layout...",
        "Adding data visualization components...",
      ],
      code: `export function AnalyticsDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>User Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={engagementData} />
        </CardContent>
      </Card>
      {/* More cards... */}
    </div>
  );
}`,
      tokens: { input: 1250, output: 3420, total: 4670 },
    },
    google: {
      status: "completed",
      thoughts: [
        "Reviewing analytics dashboard requirements...",
        "Designing modular chart components...",
        "Building responsive layout system...",
      ],
      code: `function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics().then(setMetrics);
  }, []);

  return (
    <div className="dashboard-grid">
      <MetricCard title="Revenue" value={metrics?.revenue} />
      <MetricCard title="Users" value={metrics?.users} />
    </div>
  );
}`,
      tokens: { input: 980, output: 2890, total: 3870 },
    },
  },
  selected_team: "anthropic",
  selected_output: null,
  token_usage: { input: 2230, output: 6310, total: 8540 },
  cost_usd: 0.0256,
  duration_ms: 45000,
  created_at: new Date(Date.now() - 3600000).toISOString(),
  started_at: new Date(Date.now() - 3550000).toISOString(),
  completed_at: new Date(Date.now() - 3505000).toISOString(),
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState<string>("anthropic");

  const { events: auditEvents, loading: auditLoading } = useJobAudit(jobId);

  useEffect(() => {
    // Simulate fetching job data
    const fetchJob = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setJob({ ...mockJob, id: jobId });
      setLoading(false);
    };
    fetchJob();
  }, [jobId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleExportGitHub = () => {
    toast.info("GitHub export dialog would open here");
  };

  const handleDownload = () => {
    if (!job?.selected_output) return;
    const blob = new Blob([job.outputs[job.selected_team!]?.code || ""], {
      type: "text/javascript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.title.toLowerCase().replace(/\s+/g, "-")}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded");
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!job) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Job Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The job you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button className="mt-4" onClick={() => router.push("/completions")}>
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-500", label: "Pending" },
    running: { icon: Loader2, color: "bg-blue-500", label: "Running" },
    completed: { icon: CheckCircle, color: "bg-green-500", label: "Completed" },
    failed: { icon: XCircle, color: "bg-red-500", label: "Failed" },
    cancelled: { icon: XCircle, color: "bg-gray-500", label: "Cancelled" },
  };

  const status = statusConfig[job.status];
  const StatusIcon = status.icon;

  return (
    <ErrorBoundary>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <Badge className={status.color}>
                    <StatusIcon className={`mr-1 h-3 w-3 ${job.status === "running" ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-muted-foreground">
                  {job.brief}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Created {format(new Date(job.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                  {job.duration_ms && (
                    <span>• Duration: {(job.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleExportGitHub}>
                <Github className="mr-2 h-4 w-4" />
                Push to GitHub
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content - Code output */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Code</CardTitle>
                    <Tabs value={activeTeam} onValueChange={setActiveTeam}>
                      <TabsList>
                        {job.teams_used.map((team) => (
                          <TabsTrigger key={team} value={team} className="capitalize">
                            {team}
                            {job.selected_team === team && (
                              <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.teams_used.map((team) => (
                    <div
                      key={team}
                      className={activeTeam === team ? "block" : "hidden"}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            {job.outputs[team]?.tokens.total.toLocaleString()} tokens
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(job.outputs[team]?.code || "")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <SandpackProvider
                          template="react-ts"
                          files={{
                            "/App.tsx": job.outputs[team]?.code || "",
                          }}
                          theme="dark"
                        >
                          <SandpackCodeEditor
                            showLineNumbers
                            showInlineErrors
                            style={{ height: 400 }}
                          />
                        </SandpackProvider>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Thought Stream */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Thought Stream</CardTitle>
                  <CardDescription>
                    AI reasoning process for {activeTeam}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.outputs[activeTeam]?.thoughts.map((thought, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {i + 1}
                        </div>
                        <p className="text-sm">{thought}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Tokens</span>
                    <span className="font-mono font-medium">
                      {job.token_usage.total.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Input Tokens</span>
                    <span className="font-mono">
                      {job.token_usage.input.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Output Tokens</span>
                    <span className="font-mono">
                      {job.token_usage.output.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost</span>
                    <span className="flex items-center font-mono font-medium text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {job.cost_usd.toFixed(4)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Teams Used</span>
                    <div className="flex gap-1">
                      {job.teams_used.map((team) => (
                        <Badge key={team} variant="secondary" className="capitalize">
                          {team}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {job.selected_team && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Selected</span>
                        <Badge className="bg-green-500 capitalize">
                          {job.selected_team}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Audit Trail */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>Timeline of events for this job</CardDescription>
                </CardHeader>
                <CardContent>
                  {auditLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                      ))}
                    </div>
                  ) : auditEvents.length > 0 ? (
                    <div className="space-y-3">
                      {auditEvents.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium">{event.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No activity recorded yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
