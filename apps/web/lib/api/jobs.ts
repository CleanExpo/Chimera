/**
 * Jobs API client for fetching orchestration jobs from Supabase
 */

import { createClient } from "@/lib/supabase/client";

export interface TeamOutput {
  model: string;
  thoughts: string[];
  code?: string;
  tokens: number;
  cost: number;
  status: "generating" | "complete" | "error";
  error?: string;
}

export interface OrchestrationJob {
  id: string;
  user_id?: string;
  brief: string;
  brief_summary?: string;
  target_framework: "react" | "vue" | "svelte" | "vanilla";
  status: "received" | "planning" | "dispatching" | "awaiting" | "complete" | "error";
  teams: {
    anthropic?: TeamOutput;
    google?: TeamOutput;
  };
  total_tokens: number;
  estimated_cost: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface JobsResponse {
  jobs: OrchestrationJob[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch all jobs for the current user
 */
export async function getJobs(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<JobsResponse> {
  const supabase = createClient();
  const { limit = 50, offset = 0, status } = options || {};

  let query = supabase
    .from("orchestration_jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to fetch jobs:", error);
    throw new Error(error.message);
  }

  return {
    jobs: (data as OrchestrationJob[]) || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * Fetch a single job by ID
 */
export async function getJob(jobId: string): Promise<OrchestrationJob | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("orchestration_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Failed to fetch job:", error);
    throw new Error(error.message);
  }

  return data as OrchestrationJob;
}

/**
 * Get job metrics for a user
 */
export async function getJobMetrics(): Promise<{
  totalJobs: number;
  completedJobs: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  avgDuration: number;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("orchestration_jobs")
    .select("status, total_tokens, estimated_cost, created_at, completed_at");

  if (error) {
    console.error("Failed to fetch job metrics:", error);
    throw new Error(error.message);
  }

  const jobs = data || [];
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "complete").length;
  const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const totalTokens = jobs.reduce((sum, j) => sum + (j.total_tokens || 0), 0);
  const totalCost = jobs.reduce((sum, j) => sum + parseFloat(j.estimated_cost || "0"), 0);

  // Calculate average duration for completed jobs
  const completedWithDuration = jobs.filter(
    (j) => j.status === "complete" && j.completed_at && j.created_at
  );
  const avgDuration =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, j) => {
          const start = new Date(j.created_at).getTime();
          const end = new Date(j.completed_at!).getTime();
          return sum + (end - start) / 1000; // seconds
        }, 0) / completedWithDuration.length
      : 0;

  return {
    totalJobs,
    completedJobs,
    successRate,
    totalTokens,
    totalCost,
    avgDuration,
  };
}

/**
 * Subscribe to real-time job updates
 */
export function subscribeToJobUpdates(
  onUpdate: (job: OrchestrationJob) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel("job-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orchestration_jobs",
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as OrchestrationJob);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
