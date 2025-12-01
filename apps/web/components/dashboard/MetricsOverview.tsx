"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, DollarSign, TrendingUp, Zap, Code2 } from "lucide-react";
import { getJobHistory } from "@/lib/api/orchestrate";

interface MetricsData {
  totalJobs: {
    today: number;
    week: number;
    allTime: number;
  };
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgGenerationTime: number;
  mostUsedFramework: string;
}

interface MetricsOverviewProps {
  refreshTrigger?: number;
}

export function MetricsOverview({ refreshTrigger = 0 }: MetricsOverviewProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all jobs to calculate metrics
        const response = await getJobHistory({ page: 1, page_size: 1000 });

        if (response.jobs.length === 0) {
          setMetrics({
            totalJobs: { today: 0, week: 0, allTime: 0 },
            totalTokens: 0,
            totalCost: 0,
            successRate: 0,
            avgGenerationTime: 0,
            mostUsedFramework: "N/A",
          });
          return;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let todayCount = 0;
        let weekCount = 0;
        let totalTokens = 0;
        let totalCost = 0;
        let completeCount = 0;
        let totalDuration = 0;
        let durationCount = 0;
        const frameworkCounts: Record<string, number> = {};

        response.jobs.forEach((job) => {
          const createdAt = new Date(job.created_at);

          // Count by time period
          if (createdAt >= today) todayCount++;
          if (createdAt >= weekAgo) weekCount++;

          // Accumulate tokens and cost
          totalTokens += job.total_tokens;
          totalCost += job.estimated_cost;

          // Count completed jobs
          if (job.status === "complete") completeCount++;

          // Calculate duration
          if (job.completed_at) {
            const duration =
              (new Date(job.completed_at).getTime() - createdAt.getTime()) / 1000;
            totalDuration += duration;
            durationCount++;
          }

          // Count frameworks
          frameworkCounts[job.framework] = (frameworkCounts[job.framework] || 0) + 1;
        });

        // Find most used framework
        const mostUsedFramework = Object.entries(frameworkCounts).reduce(
          (max, [framework, count]) =>
            count > (frameworkCounts[max] || 0) ? framework : max,
          "react"
        );

        setMetrics({
          totalJobs: {
            today: todayCount,
            week: weekCount,
            allTime: response.jobs.length,
          },
          totalTokens,
          totalCost,
          successRate: response.jobs.length > 0 ? (completeCount / response.jobs.length) * 100 : 0,
          avgGenerationTime: durationCount > 0 ? totalDuration / durationCount : 0,
          mostUsedFramework,
        });
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [refreshTrigger]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-500 text-sm">Error loading metrics: {error}</p>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalJobs.allTime}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalJobs.today} today, {metrics.totalJobs.week} this week
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Jobs completed successfully
          </p>
        </CardContent>
      </Card>

      {/* Total Tokens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(metrics.totalTokens / 1000000).toFixed(2)}M
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalTokens.toLocaleString()} tokens used
          </p>
        </CardContent>
      </Card>

      {/* Total Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total API usage cost
          </p>
        </CardContent>
      </Card>

      {/* Avg Generation Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.avgGenerationTime)}
          </div>
          <p className="text-xs text-muted-foreground">
            Average generation time
          </p>
        </CardContent>
      </Card>

      {/* Most Used Framework */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Framework</CardTitle>
          <Code2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">
            {metrics.mostUsedFramework}
          </div>
          <p className="text-xs text-muted-foreground">
            Most frequently used
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
