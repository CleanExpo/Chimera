"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingApprovals: number;
  totalTokens: number;
  totalCost: number;
  activeIncidents: number;
  resolvedIncidents: number;
}

export interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  teams_used: string[];
  cost_usd: number;
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  recentJobs: RecentJob[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  totalJobs: 0,
  completedJobs: 0,
  failedJobs: 0,
  pendingApprovals: 0,
  totalTokens: 0,
  totalCost: 0,
  activeIncidents: 0,
  resolvedIncidents: 0,
};

/**
 * Hook for fetching dashboard statistics from Supabase
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();

    try {
      setLoading(true);

      // Fetch job counts by status
      const { data: jobCounts, error: jobError } = await supabase
        .from("orchestration_jobs")
        .select("status", { count: "exact" });

      if (jobError) throw jobError;

      // Fetch aggregated token/cost data
      const { data: costData, error: costError } = await supabase
        .from("orchestration_jobs")
        .select("total_tokens, estimated_cost")
        .eq("status", "complete");

      if (costError) throw costError;

      // Fetch recent jobs
      const { data: recent, error: recentError } = await supabase
        .from("orchestration_jobs")
        .select("id, brief_summary, status, created_at, teams, estimated_cost")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Calculate stats
      const totalJobs = jobCounts?.length || 0;
      const completedJobs = jobCounts?.filter((j) => j.status === "complete").length || 0;
      const failedJobs = jobCounts?.filter((j) => j.status === "error").length || 0;

      const totalTokens = costData?.reduce((sum, j) => sum + (j.total_tokens || 0), 0) || 0;
      const totalCost = costData?.reduce((sum, j) => sum + (parseFloat(j.estimated_cost) || 0), 0) || 0;

      setStats({
        totalJobs,
        completedJobs,
        failedJobs,
        pendingApprovals: 0, // TODO: Implement approvals table
        totalTokens,
        totalCost,
        activeIncidents: 0, // TODO: Implement incidents table
        resolvedIncidents: 0,
      });

      // Format recent jobs
      setRecentJobs(
        (recent || []).map((job) => ({
          id: job.id,
          title: job.brief_summary || "Untitled Job",
          status: job.status,
          created_at: job.created_at,
          teams_used: Object.keys(job.teams || {}),
          cost_usd: parseFloat(job.estimated_cost) || 0,
        }))
      );

      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setStats(defaultStats);
      setRecentJobs([]);
      setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscription for job updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orchestration_jobs",
        },
        () => {
          // Refresh stats when jobs change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return {
    stats,
    recentJobs,
    loading,
    error,
    refresh: fetchStats,
  };
}

/**
 * Calculate cost savings estimate (vs manual development)
 */
export function estimateCostSavings(stats: DashboardStats | null): number {
  if (!stats) return 0;

  // Assume average manual dev cost of $150/hour
  // And average job saves 2 hours of work
  const manualCostPerJob = 300;
  const aiCost = stats.totalCost;
  const manualCost = stats.completedJobs * manualCostPerJob;

  return Math.max(0, manualCost - aiCost);
}
