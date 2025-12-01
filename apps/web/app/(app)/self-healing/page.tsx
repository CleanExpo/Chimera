"use client";

import { useState } from "react";
import {
  SelfHealingMonitor,
  type Incident,
  type SelfHealingConfig,
} from "@/components/self-healing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeartPulse,
  History,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";

// Mock incidents data
const mockIncidents: Incident[] = [
  {
    id: "inc-1",
    title: "High Memory Usage Detected",
    description: "Backend service memory exceeded 85% threshold",
    tier: 1,
    status: "resolved",
    detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    autoFixApplied: true,
    fixDescription: "Automatically cleared cache and restarted container",
  },
  {
    id: "inc-2",
    title: "API Response Time Degradation",
    description: "Average response time increased to 2.5s (threshold: 1s)",
    tier: 2,
    status: "fixing",
    detectedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    autoFixApplied: false,
  },
  {
    id: "inc-3",
    title: "Database Connection Pool Exhausted",
    description: "All available connections in use, new requests queuing",
    tier: 2,
    status: "detected",
    detectedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "inc-4",
    title: "Deployment Rollback Required",
    description: "Error rate exceeded 5% after latest deployment",
    tier: 3,
    status: "escalated",
    detectedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

export default function SelfHealingPage() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [config, setConfig] = useState<SelfHealingConfig>({
    enabled: true,
    tier1AutoFix: true,
    tier2NotifyThenFix: true,
    tier3RequireApproval: true,
  });

  const handleConfigChange = (newConfig: SelfHealingConfig) => {
    setConfig(newConfig);
    console.log("Config updated:", newConfig);
  };

  const handleManualFix = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: "fixing" as const }
          : inc
      )
    );
    // Simulate fix completion
    setTimeout(() => {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? {
                ...inc,
                status: "resolved" as const,
                resolvedAt: new Date().toISOString(),
                fixDescription: "Manually resolved by operator",
              }
            : inc
        )
      );
    }, 2000);
  };

  const handleEscalate = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: "escalated" as const, tier: Math.min(inc.tier + 1, 3) as 1 | 2 | 3 }
          : inc
      )
    );
  };

  // Calculate stats
  const totalIncidents = incidents.length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;
  const mttrMinutes = 12; // Mock MTTR
  const autoFixRate = Math.round(
    (incidents.filter((i) => i.autoFixApplied).length / totalIncidents) * 100
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-green-500" />
            Self-Healing System
          </h1>
          <p className="text-muted-foreground">
            Autonomous incident detection, diagnosis, and resolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={config.enabled ? "border-green-500 text-green-500" : ""}
          >
            {config.enabled ? "System Active" : "System Paused"}
          </Badge>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Total Incidents (24h)</span>
            </div>
            <p className="text-2xl font-bold">{totalIncidents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Auto-Fix Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{autoFixRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg MTTR</span>
            </div>
            <p className="text-2xl font-bold">{mttrMinutes}m</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <HeartPulse className="h-4 w-4" />
              <span className="text-xs">Resolution Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {Math.round((resolvedCount / totalIncidents) * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitor */}
      <SelfHealingMonitor
        incidents={incidents}
        config={config}
        onConfigChange={handleConfigChange}
        onManualFix={handleManualFix}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
