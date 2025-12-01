"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, LayoutDashboard, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { JobHistory } from "@/components/dashboard/JobHistory";
import { ProjectDashboard } from "@/components/workspace";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { hasActiveProject, projectName } = useWorkspace();

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRetry = (jobId: string) => {
    console.log("Retry job:", jobId);
    // TODO: Implement retry logic - navigate to Command Center with pre-filled brief
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your AI code generation activity and metrics
          </p>
        </div>
        <Link href="/command-center">
          <Button>
            New Job
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <FolderGit2 className="h-4 w-4" />
            Workspace
            {hasActiveProject && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({projectName})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Metrics Overview */}
          <MetricsOverview refreshTrigger={refreshTrigger} />

          {/* Usage Chart */}
          <UsageChart refreshTrigger={refreshTrigger} />

          {/* Job History */}
          <JobHistory onRetry={handleRetry} />
        </TabsContent>

        <TabsContent value="workspace">
          <ProjectDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
