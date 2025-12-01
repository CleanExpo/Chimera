/**
 * Self-Healing API
 * Manages events, diagnoses, and automated actions
 */

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type {
  SelfHealingEvent,
  SuggestedAction,
  Diagnosis,
  EventStatus,
  ActionStatus,
  RiskTier,
  DEFAULT_TIER_CONFIG,
} from "@/lib/types/self-healing";

// In-memory store for demo (would use database in production)
const events: Map<string, SelfHealingEvent> = new Map();
const actions: Map<string, SuggestedAction & { status: ActionStatus }> = new Map();

// Simulated AI diagnosis function
async function diagnoseEvent(event: Omit<SelfHealingEvent, "diagnosis">): Promise<Diagnosis> {
  // In production, this would call the AI orchestrator
  const diagnosisMap: Record<string, Partial<Diagnosis>> = {
    error: {
      rootCause: "Application exception detected",
      reasoning: "Stack trace indicates unhandled promise rejection",
      riskTier: 2,
      recommendedActions: ["restart_service", "notify_team"],
    },
    performance: {
      rootCause: "Response time degradation",
      reasoning: "P95 latency exceeded threshold by 40%",
      riskTier: 1,
      recommendedActions: ["clear_cache", "scale_resource"],
    },
    resource: {
      rootCause: "Memory pressure detected",
      reasoning: "Container memory usage at 92%",
      riskTier: 1,
      recommendedActions: ["restart_service", "scale_resource"],
    },
    availability: {
      rootCause: "Service health check failing",
      reasoning: "3 consecutive health check failures",
      riskTier: 2,
      recommendedActions: ["restart_service", "run_diagnostic"],
    },
    security: {
      rootCause: "Potential security anomaly",
      reasoning: "Unusual access pattern detected",
      riskTier: 3,
      recommendedActions: ["quarantine", "notify_team"],
    },
    configuration: {
      rootCause: "Configuration drift detected",
      reasoning: "Runtime config differs from declared state",
      riskTier: 2,
      recommendedActions: ["update_config", "notify_team"],
    },
    dependency: {
      rootCause: "External dependency degraded",
      reasoning: "Upstream service reporting errors",
      riskTier: 2,
      recommendedActions: ["notify_team", "run_diagnostic"],
    },
  };

  const diagnosis = diagnosisMap[event.type] || {
    rootCause: "Unknown issue",
    reasoning: "Unable to determine root cause",
    riskTier: 3,
    recommendedActions: ["notify_team"],
  };

  return {
    confidence: 0.75 + Math.random() * 0.2,
    rootCause: diagnosis.rootCause!,
    reasoning: diagnosis.reasoning!,
    riskTier: diagnosis.riskTier as RiskTier,
    recommendedActions: diagnosis.recommendedActions!,
  };
}

// Generate suggested action from diagnosis
function generateSuggestedAction(
  event: SelfHealingEvent,
  diagnosis: Diagnosis
): SuggestedAction {
  const actionDescriptions: Record<string, string> = {
    restart_service: "Restart the affected service to clear state",
    clear_cache: "Clear application cache to free memory",
    scale_resource: "Scale up resources to handle load",
    notify_team: "Alert the on-call team about this issue",
    run_diagnostic: "Run diagnostic checks to gather more information",
    quarantine: "Isolate the affected component for investigation",
    update_config: "Apply configuration fix",
    rollback_deployment: "Roll back to last known good deployment",
  };

  const primaryAction = diagnosis.recommendedActions[0];

  return {
    id: uuidv4(),
    eventId: event.id,
    type: primaryAction as SuggestedAction["type"],
    riskTier: diagnosis.riskTier,
    description: actionDescriptions[primaryAction] || "Execute remediation action",
    estimatedImpact: diagnosis.riskTier === 1
      ? "Minimal - automated recovery"
      : diagnosis.riskTier === 2
        ? "Moderate - brief service impact possible"
        : "Significant - requires human verification",
    rollbackPlan: diagnosis.riskTier >= 2
      ? "Automated rollback available if verification fails"
      : undefined,
  };
}

/**
 * GET /api/self-healing
 * List events and their status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as EventStatus | null;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let eventList = Array.from(events.values());

  // Filter by status if provided
  if (status) {
    eventList = eventList.filter((e) => e.status === status);
  }

  // Sort by timestamp descending
  eventList.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply limit
  eventList = eventList.slice(0, limit);

  return NextResponse.json({
    events: eventList,
    total: events.size,
    pending: Array.from(events.values()).filter(
      (e) => e.status === "pending_approval"
    ).length,
  });
}

/**
 * POST /api/self-healing
 * Report a new event or perform an action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "report-event": {
        // Report a new self-healing event
        const { source, type, severity, description, details } = body;

        const event: SelfHealingEvent = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          source: source || "unknown",
          type: type || "error",
          severity: severity || "medium",
          status: "detected",
          description: description || "Event detected",
          details: details || {},
        };

        events.set(event.id, event);

        // Auto-diagnose
        event.status = "diagnosing";
        const diagnosis = await diagnoseEvent(event);
        event.diagnosis = diagnosis;

        // Generate suggested action
        const suggestedAction = generateSuggestedAction(event, diagnosis);
        event.suggestedAction = suggestedAction;

        // Determine next status based on tier
        if (diagnosis.riskTier === 1) {
          // Tier 1: Auto-execute
          event.status = "executing";
          // Simulate execution
          setTimeout(() => {
            const e = events.get(event.id);
            if (e) {
              e.status = "resolved";
              e.resolution = {
                actionId: suggestedAction.id,
                status: "success",
                timestamp: new Date().toISOString(),
                duration: 1500 + Math.random() * 1000,
                verificationPassed: true,
                output: "Action completed successfully",
              };
            }
          }, 2000);
        } else {
          // Tier 2-3: Queue for approval
          event.status = "pending_approval";
          actions.set(suggestedAction.id, { ...suggestedAction, status: "pending" });
        }

        events.set(event.id, event);

        return NextResponse.json({
          success: true,
          event,
          autoExecuted: diagnosis.riskTier === 1,
        });
      }

      case "approve-action": {
        // Approve a pending action
        const { actionId } = body;
        const actionEntry = actions.get(actionId);

        if (!actionEntry) {
          return NextResponse.json(
            { error: "Action not found" },
            { status: 404 }
          );
        }

        // Find the associated event
        const event = events.get(actionEntry.eventId);
        if (!event) {
          return NextResponse.json(
            { error: "Event not found" },
            { status: 404 }
          );
        }

        actionEntry.status = "executing";
        event.status = "executing";

        // Simulate execution
        setTimeout(() => {
          actionEntry.status = "completed";
          event.status = "resolved";
          event.resolution = {
            actionId,
            status: "success",
            timestamp: new Date().toISOString(),
            duration: 2000 + Math.random() * 2000,
            verificationPassed: true,
            output: "Action approved and executed successfully",
          };
        }, 2500);

        return NextResponse.json({
          success: true,
          message: "Action approved and executing",
        });
      }

      case "reject-action": {
        // Reject a pending action
        const { actionId, reason } = body;
        const actionEntry = actions.get(actionId);

        if (!actionEntry) {
          return NextResponse.json(
            { error: "Action not found" },
            { status: 404 }
          );
        }

        const event = events.get(actionEntry.eventId);
        if (event) {
          event.status = "failed";
          event.resolution = {
            actionId,
            status: "failed",
            timestamp: new Date().toISOString(),
            duration: 0,
            verificationPassed: false,
            notes: reason || "Action rejected by user",
          };
        }

        actionEntry.status = "rejected";

        return NextResponse.json({
          success: true,
          message: "Action rejected",
        });
      }

      case "get-stats": {
        // Get self-healing statistics
        const eventList = Array.from(events.values());
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentEvents = eventList.filter(
          (e) => new Date(e.timestamp) > last24h
        );

        const stats = {
          total: eventList.length,
          last24h: recentEvents.length,
          byStatus: {
            detected: eventList.filter((e) => e.status === "detected").length,
            diagnosing: eventList.filter((e) => e.status === "diagnosing").length,
            pending_approval: eventList.filter((e) => e.status === "pending_approval").length,
            executing: eventList.filter((e) => e.status === "executing").length,
            resolved: eventList.filter((e) => e.status === "resolved").length,
            failed: eventList.filter((e) => e.status === "failed").length,
          },
          byTier: {
            tier1: eventList.filter((e) => e.diagnosis?.riskTier === 1).length,
            tier2: eventList.filter((e) => e.diagnosis?.riskTier === 2).length,
            tier3: eventList.filter((e) => e.diagnosis?.riskTier === 3).length,
          },
          autoResolved: eventList.filter(
            (e) => e.status === "resolved" && e.diagnosis?.riskTier === 1
          ).length,
          successRate: eventList.filter((e) => e.status === "resolved").length /
            Math.max(eventList.filter((e) => ["resolved", "failed"].includes(e.status)).length, 1),
        };

        return NextResponse.json(stats);
      }

      case "simulate-event": {
        // For demo: simulate a random event
        const eventTypes = ["error", "performance", "resource", "availability"];
        const severities = ["low", "medium", "high"];
        const sources = ["api-gateway", "auth-service", "database", "cache", "worker"];

        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
        const randomSource = sources[Math.floor(Math.random() * sources.length)];

        const descriptions: Record<string, string[]> = {
          error: [
            "Unhandled exception in request handler",
            "Database connection timeout",
            "Memory allocation failed",
          ],
          performance: [
            "Response time exceeded threshold",
            "High CPU utilization detected",
            "Slow database queries",
          ],
          resource: [
            "Memory usage critical",
            "Disk space low",
            "Connection pool exhausted",
          ],
          availability: [
            "Health check failed",
            "Service unreachable",
            "DNS resolution failed",
          ],
        };

        const descList = descriptions[randomType] || descriptions.error;
        const randomDesc = descList[Math.floor(Math.random() * descList.length)];

        // Recursively call report-event
        const reportBody = {
          action: "report-event",
          source: randomSource,
          type: randomType,
          severity: randomSeverity,
          description: randomDesc,
          details: {
            simulated: true,
            timestamp: new Date().toISOString(),
          },
        };

        const event: SelfHealingEvent = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          source: randomSource,
          type: randomType as SelfHealingEvent["type"],
          severity: randomSeverity as SelfHealingEvent["severity"],
          status: "detected",
          description: randomDesc,
          details: reportBody.details,
        };

        events.set(event.id, event);

        // Auto-diagnose
        event.status = "diagnosing";
        const diagnosis = await diagnoseEvent(event);
        event.diagnosis = diagnosis;

        // Generate suggested action
        const suggestedAction = generateSuggestedAction(event, diagnosis);
        event.suggestedAction = suggestedAction;

        if (diagnosis.riskTier === 1) {
          event.status = "executing";
          setTimeout(() => {
            const e = events.get(event.id);
            if (e) {
              e.status = "resolved";
              e.resolution = {
                actionId: suggestedAction.id,
                status: "success",
                timestamp: new Date().toISOString(),
                duration: 1500 + Math.random() * 1000,
                verificationPassed: true,
                output: "Auto-resolved by Tier 1 action",
              };
            }
          }, 2000);
        } else {
          event.status = "pending_approval";
          actions.set(suggestedAction.id, { ...suggestedAction, status: "pending" });
        }

        events.set(event.id, event);

        return NextResponse.json({
          success: true,
          event,
          message: "Simulated event created",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Self-healing API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    );
  }
}
