"use client";

import { useEffect, useState } from "react";
import { useSelfHealing } from "@/hooks/useSelfHealing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Shield,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Sparkles,
  TrendingUp,
  XCircle,
  Settings,
  Bell,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelfHealingEvent, RiskTier, EventStatus, Severity } from "@/lib/types/self-healing";

// Legacy types for backwards compatibility
export type AutonomyTier = 1 | 2 | 3;
export type IncidentStatus = "detected" | "diagnosing" | "fixing" | "resolved" | "escalated";

export interface Incident {
  id: string;
  title: string;
  description: string;
  tier: AutonomyTier;
  status: IncidentStatus;
  detectedAt: string;
  resolvedAt?: string;
  autoFixApplied?: boolean;
  fixDescription?: string;
}

export interface SelfHealingConfig {
  enabled: boolean;
  tier1AutoFix: boolean;
  tier2NotifyThenFix: boolean;
  tier3RequireApproval: boolean;
}

interface SelfHealingMonitorProps {
  // Legacy props for backwards compatibility
  incidents?: Incident[];
  config?: SelfHealingConfig;
  onConfigChange?: (config: SelfHealingConfig) => void;
  onManualFix?: (incidentId: string) => void;
  onEscalate?: (incidentId: string) => void;
  // New API-connected mode
  useApi?: boolean;
}

const tierConfig: Record<AutonomyTier, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  1: {
    label: "Auto-Fix",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Low risk - executes immediately",
  },
  2: {
    label: "Notify & Fix",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    description: "Medium risk - alerts then executes",
  },
  3: {
    label: "Approval Required",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "High risk - requires human approval",
  },
};

/**
 * Enhanced Self-Healing Monitor with API integration
 */
export function SelfHealingMonitor({
  incidents: legacyIncidents,
  config: legacyConfig,
  onConfigChange,
  onManualFix,
  onEscalate,
  useApi = true,
}: SelfHealingMonitorProps) {
  // API-connected mode
  if (useApi) {
    return <ApiConnectedMonitor />;
  }

  // Legacy mode for backwards compatibility
  return (
    <LegacyMonitor
      incidents={legacyIncidents || []}
      config={legacyConfig || { enabled: true, tier1AutoFix: true, tier2NotifyThenFix: true, tier3RequireApproval: true }}
      onConfigChange={onConfigChange || (() => {})}
      onManualFix={onManualFix}
      onEscalate={onEscalate}
    />
  );
}

/**
 * API-Connected Self-Healing Monitor
 */
function ApiConnectedMonitor() {
  const {
    events,
    pendingCount,
    stats,
    isLoading,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    simulateEvent,
    approveAction,
    rejectAction,
    fetchEvents,
  } = useSelfHealing();

  const [config, setConfig] = useState<SelfHealingConfig>({
    enabled: true,
    tier1AutoFix: true,
    tier2NotifyThenFix: true,
    tier3RequireApproval: true,
  });

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring(5000);
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  const pendingEvents = events.filter((e) => e.status === "pending_approval");
  const activeEvents = events.filter((e) =>
    ["detected", "diagnosing", "executing"].includes(e.status)
  );
  const resolvedEvents = events.filter((e) =>
    ["resolved", "failed"].includes(e.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Self-Healing Monitor
          </h2>
          <p className="text-sm text-muted-foreground">
            Automated detection, diagnosis, and remediation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateEvent}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Simulate Event
          </Button>
          <Button
            variant={isMonitoring ? "secondary" : "default"}
            size="sm"
            onClick={() => (isMonitoring ? stopMonitoring() : startMonitoring())}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Monitor
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchEvents()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          label="Total Events"
          value={stats?.total ?? 0}
          subLabel="All time"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label="Last 24h"
          value={stats?.last24h ?? 0}
          subLabel="Recent events"
        />
        <StatsCard
          icon={<Zap className="h-5 w-5" />}
          label="Auto-Resolved"
          value={stats?.autoResolved ?? 0}
          subLabel="Tier 1 fixes"
          highlight
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Success Rate"
          value={`${Math.round((stats?.successRate ?? 0) * 100)}%`}
          subLabel="Resolution rate"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Autonomy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Self-Healing Enabled</p>
                <p className="text-sm text-muted-foreground">Master switch</p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* Tier Cards */}
              {([1, 2, 3] as AutonomyTier[]).map((tier) => (
                <div key={tier} className={cn("p-3 rounded-lg", tierConfig[tier].bgColor)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-medium", tierConfig[tier].color)}>
                      Tier {tier}: {tierConfig[tier].label}
                    </span>
                    <Badge variant="outline" className={tierConfig[tier].color}>
                      {stats?.byTier?.[`tier${tier}`] ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tierConfig[tier].description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Event Feed
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pending
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingEvents.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-12 w-12" />}
                    title="No pending approvals"
                    description="All systems operating normally"
                  />
                ) : (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3 pr-4">
                      {pendingEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onApprove={() =>
                            event.suggestedAction && approveAction(event.suggestedAction.id)
                          }
                          onReject={() =>
                            event.suggestedAction && rejectAction(event.suggestedAction.id)
                          }
                          showActions
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="active">
                {activeEvents.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-12 w-12" />}
                    title="No active events"
                    description="System is idle"
                  />
                ) : (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3 pr-4">
                      {activeEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="history">
                {resolvedEvents.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-12 w-12" />}
                    title="No event history"
                    description="Events will appear here after resolution"
                  />
                ) : (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3 pr-4">
                      {resolvedEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Stats card component
 */
function StatsCard({
  icon,
  label,
  value,
  subLabel,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subLabel: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-green-500/50 bg-green-500/5")}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            highlight ? "bg-green-500/20 text-green-500" : "bg-primary/10 text-primary"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state component
 */
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <div className="mx-auto mb-3 opacity-50">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}

/**
 * Event card component
 */
function EventCard({
  event,
  onApprove,
  onReject,
  showActions,
}: {
  event: SelfHealingEvent;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}) {
  const statusConfig: Record<EventStatus, { icon: React.ReactNode; color: string }> = {
    detected: { icon: <AlertCircle className="h-4 w-4" />, color: "text-blue-500" },
    diagnosing: { icon: <Activity className="h-4 w-4 animate-pulse" />, color: "text-blue-500" },
    pending_approval: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-yellow-500" },
    executing: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: "text-blue-500" },
    resolved: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-500" },
    failed: { icon: <XCircle className="h-4 w-4" />, color: "text-red-500" },
  };

  const severityColors: Record<Severity, string> = {
    low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const { icon, color } = statusConfig[event.status];

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", color)}>{icon}</div>
          <div>
            <p className="font-medium">{event.description}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", severityColors[event.severity])}>
                {event.severity}
              </Badge>
              {event.diagnosis && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    event.diagnosis.riskTier === 1
                      ? "border-green-500/50 text-green-500"
                      : event.diagnosis.riskTier === 2
                        ? "border-yellow-500/50 text-yellow-500"
                        : "border-red-500/50 text-red-500"
                  )}
                >
                  Tier {event.diagnosis.riskTier}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Diagnosis */}
      {event.diagnosis && (
        <div className="bg-muted/50 rounded-md p-3 text-sm">
          <p className="font-medium mb-1">
            Diagnosis ({Math.round(event.diagnosis.confidence * 100)}% confidence)
          </p>
          <p className="text-muted-foreground">{event.diagnosis.rootCause}</p>
          <p className="text-xs text-muted-foreground mt-1">{event.diagnosis.reasoning}</p>
        </div>
      )}

      {/* Suggested Action */}
      {event.suggestedAction && (
        <div className="flex items-center justify-between bg-primary/5 rounded-md p-3">
          <div className="text-sm flex-1 mr-4">
            <p className="font-medium">Suggested: {event.suggestedAction.description}</p>
            <p className="text-xs text-muted-foreground">{event.suggestedAction.estimatedImpact}</p>
          </div>
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={onReject}>
                Reject
              </Button>
              <Button size="sm" onClick={onApprove}>
                Approve
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Resolution */}
      {event.resolution && (
        <div
          className={cn(
            "rounded-md p-3 text-sm",
            event.resolution.status === "success"
              ? "bg-green-500/10"
              : "bg-red-500/10"
          )}
        >
          <p className="font-medium">
            {event.resolution.status === "success" ? "Resolved" : "Failed"}
            {event.resolution.duration && ` in ${Math.round(event.resolution.duration)}ms`}
          </p>
          {event.resolution.output && (
            <p className="text-xs text-muted-foreground mt-1">{event.resolution.output}</p>
          )}
          {event.resolution.notes && (
            <p className="text-xs text-muted-foreground mt-1">{event.resolution.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Legacy Monitor Component (for backwards compatibility)
 */
function LegacyMonitor({
  incidents,
  config,
  onConfigChange,
  onManualFix,
  onEscalate,
}: {
  incidents: Incident[];
  config: SelfHealingConfig;
  onConfigChange: (config: SelfHealingConfig) => void;
  onManualFix?: (incidentId: string) => void;
  onEscalate?: (incidentId: string) => void;
}) {
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");
  const autoFixedCount = incidents.filter((i) => i.autoFixApplied).length;

  const statusConfigMap: Record<IncidentStatus, {
    icon: React.ElementType;
    color: string;
    label: string;
  }> = {
    detected: { icon: AlertTriangle, color: "text-yellow-500", label: "Detected" },
    diagnosing: { icon: Activity, color: "text-blue-500", label: "Diagnosing" },
    fixing: { icon: RefreshCw, color: "text-purple-500", label: "Fixing" },
    resolved: { icon: CheckCircle, color: "text-green-500", label: "Resolved" },
    escalated: { icon: Bell, color: "text-red-500", label: "Escalated" },
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                config.enabled ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="font-bold">{config.enabled ? "Active" : "Disabled"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Active Incidents</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{activeIncidents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Auto-Fixed</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{autoFixedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Resolved</span>
            </div>
            <p className="text-2xl font-bold">{resolvedIncidents.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Autonomy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Self-Healing Enabled</p>
                <p className="text-sm text-muted-foreground">Master switch</p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => onConfigChange({ ...config, enabled: checked })}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              {([1, 2, 3] as AutonomyTier[]).map((tier) => (
                <div key={tier} className={cn("p-3 rounded-lg", tierConfig[tier].bgColor)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-medium", tierConfig[tier].color)}>
                      Tier {tier}: {tierConfig[tier].label}
                    </span>
                    <Switch
                      checked={
                        tier === 1
                          ? config.tier1AutoFix
                          : tier === 2
                            ? config.tier2NotifyThenFix
                            : config.tier3RequireApproval
                      }
                      onCheckedChange={(checked) => {
                        if (tier === 1) onConfigChange({ ...config, tier1AutoFix: checked });
                        else if (tier === 2) onConfigChange({ ...config, tier2NotifyThenFix: checked });
                        else onConfigChange({ ...config, tier3RequireApproval: checked });
                      }}
                      disabled={!config.enabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{tierConfig[tier].description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Incident Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <EmptyState
                icon={<Shield className="h-12 w-12" />}
                title="No incidents detected"
                description="System is operating normally"
              />
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {incidents.map((incident) => {
                    const tier = tierConfig[incident.tier];
                    const status = statusConfigMap[incident.status];
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={incident.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          incident.status === "detected" && "border-yellow-500/50 bg-yellow-500/5",
                          incident.status === "escalated" && "border-red-500/50 bg-red-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                status.color,
                                incident.status === "fixing" && "animate-spin"
                              )}
                            />
                            <span className="font-medium">{incident.title}</span>
                          </div>
                          <Badge variant="outline" className={tier.color}>
                            Tier {incident.tier}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>

                        {incident.fixDescription && (
                          <div className="text-xs bg-muted/50 p-2 rounded mb-3">
                            <span className="font-medium">Fix applied:</span> {incident.fixDescription}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(incident.detectedAt).toLocaleTimeString()}
                            {incident.autoFixApplied && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Auto-fixed
                              </Badge>
                            )}
                          </div>

                          {incident.status !== "resolved" && incident.status !== "escalated" && (
                            <div className="flex items-center gap-2">
                              {onManualFix && (
                                <Button size="sm" variant="outline" onClick={() => onManualFix(incident.id)}>
                                  Manual Fix
                                </Button>
                              )}
                              {onEscalate && incident.tier < 3 && (
                                <Button size="sm" variant="outline" onClick={() => onEscalate(incident.id)}>
                                  Escalate
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SelfHealingMonitor;
