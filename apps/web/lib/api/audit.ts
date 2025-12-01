/**
 * Audit Trail API client for tracking and retrieving audit events
 */

import { createClient } from "@/lib/supabase/client";

export type AuditActor = "user" | "system" | "ai";
export type AuditCategory =
  | "generation"
  | "approval"
  | "export"
  | "config"
  | "error"
  | "auth"
  | "self_healing";
export type AuditSeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface AuditEvent {
  id: string;
  user_id?: string;
  action: string;
  actor: AuditActor;
  category: AuditCategory;
  job_id?: string;
  details: string;
  metadata?: Record<string, unknown>;
  severity: AuditSeverity;
  created_at: string;
}

export interface AuditEventsResponse {
  events: AuditEvent[];
  total: number;
  hasMore: boolean;
}

export interface LogAuditEventParams {
  action: string;
  actor: AuditActor;
  category: AuditCategory;
  details: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from("audit_trail").insert({
    action: params.action,
    actor: params.actor,
    category: params.category,
    details: params.details,
    job_id: params.jobId,
    metadata: params.metadata || {},
    severity: params.severity || "info",
  }).select("id").single();

  if (error) {
    console.error("Failed to log audit event:", error);
    return null;
  }

  return data?.id || null;
}

/**
 * Fetch audit events with optional filters
 */
export async function getAuditEvents(options?: {
  limit?: number;
  offset?: number;
  category?: AuditCategory;
  jobId?: string;
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
}): Promise<AuditEventsResponse> {
  const supabase = createClient();
  const { limit = 50, offset = 0, category, jobId, severity, startDate, endDate } = options || {};

  let query = supabase
    .from("audit_trail")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to fetch audit events:", error);
    throw new Error(error.message);
  }

  return {
    events: (data as AuditEvent[]) || [],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * Get audit events for a specific job
 */
export async function getJobAuditEvents(jobId: string): Promise<AuditEvent[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("audit_trail")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch job audit events:", error);
    throw new Error(error.message);
  }

  return (data as AuditEvent[]) || [];
}

/**
 * Subscribe to real-time audit events
 */
export function subscribeToAuditEvents(
  onEvent: (event: AuditEvent) => void,
  filter?: { category?: AuditCategory }
) {
  const supabase = createClient();

  const channel = supabase
    .channel("audit-events")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_trail",
        filter: filter?.category ? `category=eq.${filter.category}` : undefined,
      },
      (payload) => {
        if (payload.new) {
          onEvent(payload.new as AuditEvent);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Pre-built audit logging functions for common events

export const auditJobStarted = (jobId: string, brief: string) =>
  logAuditEvent({
    action: "Job Started",
    actor: "system",
    category: "generation",
    details: `Started generating: ${brief.slice(0, 100)}`,
    jobId,
    metadata: { brief },
  });

export const auditJobCompleted = (jobId: string, success: boolean, teamsUsed: string[]) =>
  logAuditEvent({
    action: success ? "Job Completed" : "Job Failed",
    actor: "system",
    category: "generation",
    details: success
      ? `Successfully completed generation with ${teamsUsed.join(", ")}`
      : "Generation failed",
    jobId,
    severity: success ? "info" : "error",
    metadata: { success, teamsUsed },
  });

export const auditApprovalDecision = (
  jobId: string,
  decision: "approved" | "rejected" | "changes_requested",
  team?: string
) =>
  logAuditEvent({
    action: `Job ${decision.replace("_", " ")}`,
    actor: "user",
    category: "approval",
    details: `${decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Requested changes for"} ${team ? `${team} output` : "job"}`,
    jobId,
    metadata: { decision, team },
  });

export const auditCodeExported = (
  jobId: string,
  destination: "download" | "github",
  details?: string
) =>
  logAuditEvent({
    action: "Code Exported",
    actor: "user",
    category: "export",
    details: `Exported code ${destination === "github" ? "to GitHub" : "as download"}${details ? `: ${details}` : ""}`,
    jobId,
    metadata: { destination, details },
  });

export const auditConfigChanged = (setting: string, oldValue: unknown, newValue: unknown) =>
  logAuditEvent({
    action: "Config Changed",
    actor: "user",
    category: "config",
    details: `Changed ${setting}`,
    metadata: { setting, oldValue, newValue },
  });

export const auditIncidentDetected = (
  incidentId: string,
  title: string,
  tier: number
) =>
  logAuditEvent({
    action: "Incident Detected",
    actor: "system",
    category: "self_healing",
    details: `Detected: ${title} (Tier ${tier})`,
    severity: tier === 3 ? "critical" : tier === 2 ? "warning" : "info",
    metadata: { incidentId, tier },
  });

export const auditIncidentResolved = (
  incidentId: string,
  title: string,
  autoFixed: boolean
) =>
  logAuditEvent({
    action: "Incident Resolved",
    actor: autoFixed ? "system" : "user",
    category: "self_healing",
    details: `Resolved: ${title} (${autoFixed ? "auto-fixed" : "manually fixed"})`,
    metadata: { incidentId, autoFixed },
  });
