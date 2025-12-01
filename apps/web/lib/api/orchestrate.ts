/**
 * Orchestration API Client
 * Communicates with FastAPI Backend Brain for AI code generation
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8888";

// TypeScript types matching backend Pydantic models
export type TargetFramework = "react" | "vue" | "svelte" | "vanilla";
export type AITeam = "anthropic" | "google";
export type TeamStatus = "pending" | "thinking" | "generating" | "complete" | "error";
export type OrchestrationStatus = "received" | "planning" | "dispatching" | "awaiting" | "complete" | "error";

export interface WorkspaceContext {
  project_path: string;
  project_name: string;
  framework?: string;
  language?: string;
  package_manager?: string;
  git_branch?: string;
  git_remote?: string;
  dependencies?: string[];
}

export interface BriefPayload {
  brief: string;
  target_framework?: TargetFramework;
  style_preferences?: Record<string, unknown>;
  include_teams?: AITeam[];
  workspace?: WorkspaceContext;
}

export interface ThoughtStreamItem {
  id: string;
  text: string;
  timestamp: string;
  team: AITeam;
}

export interface TeamOutput {
  team: AITeam;
  status: TeamStatus;
  thoughts: ThoughtStreamItem[];
  generated_code?: string;
  model_used: string;
  token_count: number;
  error_message?: string;
}

export interface OrchestrationResponse {
  job_id: string;
  status: OrchestrationStatus;
  brief_summary: string;
  teams: Record<string, TeamOutput>;
  total_tokens: number;
  estimated_cost: number;
}

export interface OrchestrationStatusResponse {
  job_id: string;
  status: string;
  progress: number; // 0-100
  teams: Record<string, TeamOutput>;
}

export interface AIModel {
  id: string;
  name: string;
  tier: "premium" | "standard" | "fast";
}

export interface AvailableModelsResponse {
  anthropic: {
    models: AIModel[];
    default: string;
  };
  google: {
    models: AIModel[];
    default: string;
  };
}

/**
 * Submit a brief to the Backend Brain for AI code generation
 */
export async function submitBrief(payload: BriefPayload): Promise<OrchestrationResponse> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/brief`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to submit brief" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to submit brief`);
  }

  return response.json();
}

/**
 * Poll the status of an orchestration job
 */
export async function getJobStatus(jobId: string): Promise<OrchestrationStatusResponse> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/status/${jobId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Job not found");
    }
    const error = await response.json().catch(() => ({ detail: "Failed to get job status" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to get job status`);
  }

  return response.json();
}

/**
 * Get available AI models from the backend
 */
export async function getAvailableModels(): Promise<AvailableModelsResponse> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/models`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get models" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to get available models`);
  }

  return response.json();
}

/**
 * Manually trigger code generation for a job (testing/debugging)
 */
export async function triggerGeneration(jobId: string): Promise<{ message: string; job_id: string }> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/generate/${jobId}`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to trigger generation" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to trigger generation`);
  }

  return response.json();
}

/**
 * Cancel an orchestration job
 */
export async function cancelJob(jobId: string): Promise<{ message: string; job_id: string }> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/job/${jobId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to cancel job" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to cancel job`);
  }

  return response.json();
}

/**
 * Check if the backend is healthy and reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Job history types
export interface JobHistoryItem {
  job_id: string;
  brief_summary: string;
  status: OrchestrationStatus;
  framework: TargetFramework;
  created_at: string;
  completed_at?: string;
  total_tokens: number;
  estimated_cost: number;
  teams: {
    team: AITeam;
    status: TeamStatus;
    code_preview?: string; // First 200 chars of generated code
  }[];
}

export interface JobHistoryResponse {
  jobs: JobHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface JobHistoryFilters {
  status?: OrchestrationStatus;
  framework?: TargetFramework;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * Get job history with optional filtering
 */
export async function getJobHistory(filters?: JobHistoryFilters): Promise<JobHistoryResponse> {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.framework) params.append("framework", filters.framework);
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.page_size) params.append("page_size", filters.page_size.toString());

  const queryString = params.toString();
  const url = `${BACKEND_URL}/api/orchestrate/history${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to get job history" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to get job history`);
  }

  return response.json();
}

/**
 * Get detailed job information including full code and thoughts
 */
export async function getJobDetails(jobId: string): Promise<OrchestrationResponse> {
  const response = await fetch(`${BACKEND_URL}/api/orchestrate/job/${jobId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Job not found");
    }
    const error = await response.json().catch(() => ({ detail: "Failed to get job details" }));
    throw new Error(error.detail || `HTTP ${response.status}: Failed to get job details`);
  }

  return response.json();
}
