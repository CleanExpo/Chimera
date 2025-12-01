"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export type ServiceHealth = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceStatus {
  id: string;
  name: string;
  type: "api" | "database" | "ai" | "websocket";
  health: ServiceHealth;
  latency?: number; // in ms
  uptime?: number; // percentage
  lastCheck?: string;
  message?: string;
}

interface HealthIndicatorsProps {
  services: ServiceStatus[];
  className?: string;
}

const healthConfig: Record<ServiceHealth, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  healthy: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Degraded",
  },
  down: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Down",
  },
  unknown: {
    icon: Activity,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Unknown",
  },
};

const serviceIcons = {
  api: Globe,
  database: Database,
  ai: Cpu,
  websocket: Zap,
};

function ServiceCard({ service }: { service: ServiceStatus }) {
  const health = healthConfig[service.health];
  const TypeIcon = serviceIcons[service.type];
  const HealthIcon = health.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        health.bgColor,
        service.health === "down" && "border-red-500/50"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{service.name}</span>
        </div>
        <div className={cn("flex items-center gap-1", health.color)}>
          <HealthIcon className="h-4 w-4" />
          <span className="text-xs">{health.label}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {service.latency !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Latency</span>
            <span
              className={cn(
                service.latency < 100
                  ? "text-green-500"
                  : service.latency < 500
                  ? "text-yellow-500"
                  : "text-red-500"
              )}
            >
              {service.latency}ms
            </span>
          </div>
        )}

        {service.uptime !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span>{service.uptime.toFixed(2)}%</span>
            </div>
            <Progress value={service.uptime} className="h-1" />
          </div>
        )}

        {service.message && (
          <p className="text-xs text-muted-foreground mt-2">
            {service.message}
          </p>
        )}
      </div>
    </div>
  );
}

export function HealthIndicators({ services, className }: HealthIndicatorsProps) {
  const healthyCount = services.filter((s) => s.health === "healthy").length;
  const degradedCount = services.filter((s) => s.health === "degraded").length;
  const downCount = services.filter((s) => s.health === "down").length;

  const overallHealth: ServiceHealth =
    downCount > 0
      ? "down"
      : degradedCount > 0
      ? "degraded"
      : healthyCount === services.length
      ? "healthy"
      : "unknown";

  const overallConfig = healthConfig[overallHealth];
  const OverallIcon = overallConfig.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("flex items-center gap-1", overallConfig.color)}
          >
            <OverallIcon className="h-3 w-3" />
            {overallConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No services configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Summary */}
        {services.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-sm">
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span>{healthyCount} healthy</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span>{degradedCount} degraded</span>
            </div>
            <div className="flex items-center gap-1 text-red-500">
              <XCircle className="h-4 w-4" />
              <span>{downCount} down</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
