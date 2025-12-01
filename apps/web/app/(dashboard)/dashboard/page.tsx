"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { JobHistory } from "@/components/dashboard/JobHistory";

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

      {/* Metrics Overview */}
      <MetricsOverview refreshTrigger={refreshTrigger} />

      {/* Usage Chart */}
      <UsageChart refreshTrigger={refreshTrigger} />

      {/* Job History */}
      <JobHistory onRetry={handleRetry} />
    </div>
  );
}
