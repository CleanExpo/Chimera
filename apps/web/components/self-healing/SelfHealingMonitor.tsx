"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Clock,
  Settings,
  Bell,
  Activity,
} from "lucide-react";

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
  tier1AutoFix: boolean; // Container restarts, cache clearing
  tier2NotifyThenFix: boolean; // Config changes, scaling
  tier3RequireApproval: boolean; // Database changes, deployments
}

interface SelfHealingMonitorProps {
  incidents: Incident[];
  config: SelfHealingConfig;
  onConfigChange: (config: SelfHealingConfig) => void;
  onManualFix?: (incidentId: string) => void;
  onEscalate?: (incidentId: string) => void;
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

const statusConfig: Record<IncidentStatus, {
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

function IncidentCard({
  incident,
  onManualFix,
  onEscalate,
}: {
  incident: Incident;
  onManualFix?: (id: string) => void;
  onEscalate?: (id: string) => void;
}) {
  const tier = tierConfig[incident.tier];
  const status = statusConfig[incident.status];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      incident.status === "detected" && "border-yellow-500/50 bg-yellow-500/5",
      incident.status === "escalated" && "border-red-500/50 bg-red-500/5"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-4 w-4", status.color, incident.status === "fixing" && "animate-spin")} />
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
}

export function SelfHealingMonitor({
  incidents,
  config,
  onConfigChange,
  onManualFix,
  onEscalate,
}: SelfHealingMonitorProps) {
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");
  const autoFixedCount = incidents.filter((i) => i.autoFixApplied).length;

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
              {/* Tier 1 */}
              <div className={cn("p-3 rounded-lg", tierConfig[1].bgColor)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("font-medium", tierConfig[1].color)}>
                    Tier 1: {tierConfig[1].label}
                  </span>
                  <Switch
                    checked={config.tier1AutoFix}
                    onCheckedChange={(checked) => onConfigChange({ ...config, tier1AutoFix: checked })}
                    disabled={!config.enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{tierConfig[1].description}</p>
                <p className="text-xs mt-1">Container restarts, cache clearing</p>
              </div>

              {/* Tier 2 */}
              <div className={cn("p-3 rounded-lg", tierConfig[2].bgColor)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("font-medium", tierConfig[2].color)}>
                    Tier 2: {tierConfig[2].label}
                  </span>
                  <Switch
                    checked={config.tier2NotifyThenFix}
                    onCheckedChange={(checked) => onConfigChange({ ...config, tier2NotifyThenFix: checked })}
                    disabled={!config.enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{tierConfig[2].description}</p>
                <p className="text-xs mt-1">Config changes, auto-scaling</p>
              </div>

              {/* Tier 3 */}
              <div className={cn("p-3 rounded-lg", tierConfig[3].bgColor)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("font-medium", tierConfig[3].color)}>
                    Tier 3: {tierConfig[3].label}
                  </span>
                  <Switch
                    checked={config.tier3RequireApproval}
                    onCheckedChange={(checked) => onConfigChange({ ...config, tier3RequireApproval: checked })}
                    disabled={!config.enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{tierConfig[3].description}</p>
                <p className="text-xs mt-1">Database changes, deployments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Incident Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No incidents detected</p>
                <p className="text-sm">System is operating normally</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onManualFix={onManualFix}
                      onEscalate={onEscalate}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
