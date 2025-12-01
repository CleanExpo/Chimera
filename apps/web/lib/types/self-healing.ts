/**
 * Self-Healing System Types
 * Implements tiered autonomy for automated issue resolution
 */

// Risk tiers for self-healing actions
export type RiskTier = 1 | 2 | 3;

// Event severity levels
export type Severity = "low" | "medium" | "high" | "critical";

// Event status
export type EventStatus = "detected" | "diagnosing" | "pending_approval" | "executing" | "resolved" | "failed";

// Action status
export type ActionStatus = "pending" | "approved" | "executing" | "completed" | "failed" | "rejected";

/**
 * Self-healing event - detected issue or anomaly
 */
export interface SelfHealingEvent {
  id: string;
  timestamp: string;
  source: string;
  type: EventType;
  severity: Severity;
  status: EventStatus;
  description: string;
  details: Record<string, unknown>;
  diagnosis?: Diagnosis;
  suggestedAction?: SuggestedAction;
  resolution?: Resolution;
}

/**
 * Event types that can trigger self-healing
 */
export type EventType =
  | "error"
  | "performance"
  | "resource"
  | "security"
  | "availability"
  | "configuration"
  | "dependency";

/**
 * AI diagnosis of an event
 */
export interface Diagnosis {
  confidence: number; // 0-1
  rootCause: string;
  reasoning: string;
  riskTier: RiskTier;
  recommendedActions: string[];
}

/**
 * Suggested action from the self-healing system
 */
export interface SuggestedAction {
  id: string;
  eventId: string;
  type: ActionType;
  riskTier: RiskTier;
  description: string;
  command?: string;
  params?: Record<string, unknown>;
  estimatedImpact: string;
  rollbackPlan?: string;
}

/**
 * Action types the system can take
 */
export type ActionType =
  | "restart_service"
  | "clear_cache"
  | "scale_resource"
  | "update_config"
  | "rollback_deployment"
  | "notify_team"
  | "run_diagnostic"
  | "apply_patch"
  | "quarantine"
  | "custom";

/**
 * Resolution record for completed actions
 */
export interface Resolution {
  actionId: string;
  status: "success" | "partial" | "failed";
  timestamp: string;
  duration: number; // ms
  output?: string;
  verificationPassed: boolean;
  notes?: string;
}

/**
 * Self-healing configuration
 */
export interface SelfHealingConfig {
  enabled: boolean;
  tiers: TierConfig[];
  notifications: NotificationConfig;
  monitoring: MonitoringConfig;
}

/**
 * Configuration for each risk tier
 */
export interface TierConfig {
  tier: RiskTier;
  autoExecute: boolean;
  requireApproval: boolean;
  notifyBefore: boolean;
  notifyAfter: boolean;
  maxRetries: number;
  cooldownMinutes: number;
}

/**
 * Notification settings
 */
export interface NotificationConfig {
  email: boolean;
  slack: boolean;
  webhook?: string;
  escalationMinutes: number;
}

/**
 * Monitoring settings
 */
export interface MonitoringConfig {
  pollIntervalSeconds: number;
  errorThreshold: number;
  performanceThreshold: number;
  sources: MonitoringSource[];
}

/**
 * Monitoring source configuration
 */
export interface MonitoringSource {
  id: string;
  name: string;
  type: "api" | "logs" | "metrics" | "health_check";
  endpoint?: string;
  enabled: boolean;
}

/**
 * Default tier configurations
 */
export const DEFAULT_TIER_CONFIG: TierConfig[] = [
  {
    tier: 1,
    autoExecute: true,
    requireApproval: false,
    notifyBefore: false,
    notifyAfter: true,
    maxRetries: 3,
    cooldownMinutes: 5,
  },
  {
    tier: 2,
    autoExecute: true,
    requireApproval: false,
    notifyBefore: true,
    notifyAfter: true,
    maxRetries: 2,
    cooldownMinutes: 15,
  },
  {
    tier: 3,
    autoExecute: false,
    requireApproval: true,
    notifyBefore: true,
    notifyAfter: true,
    maxRetries: 1,
    cooldownMinutes: 60,
  },
];

/**
 * Map action types to their default risk tiers
 */
export const ACTION_RISK_TIERS: Record<ActionType, RiskTier> = {
  restart_service: 1,
  clear_cache: 1,
  run_diagnostic: 1,
  notify_team: 1,
  scale_resource: 2,
  update_config: 2,
  apply_patch: 2,
  quarantine: 2,
  rollback_deployment: 3,
  custom: 3,
};
