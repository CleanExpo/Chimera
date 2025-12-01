"use client";

import { useState } from "react";
import { ApprovalQueue, type ApprovalItem } from "@/components/approvals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

// Mock data - in production, this would come from the backend
const mockApprovals: ApprovalItem[] = [
  {
    id: "approval-1",
    jobId: "job-123",
    title: "Generate User Dashboard Component",
    description: "AI-generated React component for user analytics dashboard with charts and metrics display",
    type: "code_generation",
    status: "pending",
    riskLevel: "low",
    confidence: 0.94,
    requestedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    requestedBy: "orchestrator",
    reasoning: [
      {
        id: "r1",
        step: "Requirement Analysis",
        explanation: "Analyzed brief to identify key dashboard components: metrics cards, charts, and user activity feed",
        confidence: 0.96,
      },
      {
        id: "r2",
        step: "Component Architecture",
        explanation: "Designed modular structure with separate components for metrics, charts, and activity list",
        confidence: 0.93,
      },
      {
        id: "r3",
        step: "Code Generation",
        explanation: "Generated TypeScript React component with Tailwind CSS styling and Recharts integration",
        confidence: 0.94,
      },
      {
        id: "r4",
        step: "Quality Review",
        explanation: "Self-reviewed code for best practices, accessibility, and type safety",
        confidence: 0.92,
      },
    ],
    affectedFiles: ["components/dashboard/UserDashboard.tsx", "components/dashboard/MetricsCard.tsx"],
  },
  {
    id: "approval-2",
    jobId: "job-124",
    title: "Database Schema Migration",
    description: "Add new columns to users table for enhanced profile features",
    type: "database_migration",
    status: "pending",
    riskLevel: "high",
    confidence: 0.78,
    requestedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    requestedBy: "orchestrator",
    reasoning: [
      {
        id: "r1",
        step: "Schema Analysis",
        explanation: "Identified required new fields: avatar_url, bio, social_links",
        confidence: 0.95,
      },
      {
        id: "r2",
        step: "Migration Planning",
        explanation: "Created reversible migration with proper null handling",
        confidence: 0.82,
      },
      {
        id: "r3",
        step: "Risk Assessment",
        explanation: "Flagged as high risk due to production database modification",
        confidence: 0.75,
      },
    ],
    affectedFiles: ["supabase/migrations/20241201_add_profile_fields.sql"],
  },
  {
    id: "approval-3",
    jobId: "job-125",
    title: "API Configuration Update",
    description: "Update rate limiting configuration for public API endpoints",
    type: "config_change",
    status: "pending",
    riskLevel: "medium",
    confidence: 0.85,
    requestedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    requestedBy: "orchestrator",
    reasoning: [
      {
        id: "r1",
        step: "Current Config Analysis",
        explanation: "Analyzed current rate limits and identified bottlenecks",
        confidence: 0.90,
      },
      {
        id: "r2",
        step: "Optimization Proposal",
        explanation: "Proposed new limits based on usage patterns and server capacity",
        confidence: 0.85,
      },
    ],
    affectedFiles: ["apps/backend/src/config/rate_limits.py"],
  },
];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals);

  const handleApprove = (id: string, feedback?: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "approved" as const } : item
      )
    );
    console.log(`Approved ${id}`, feedback);
  };

  const handleReject = (id: string, reason: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "rejected" as const } : item
      )
    );
    console.log(`Rejected ${id}:`, reason);
  };

  const handleRequestChanges = (id: string, changes: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "needs_review" as const } : item
      )
    );
    console.log(`Requested changes for ${id}:`, changes);
  };

  const handlePreview = (id: string) => {
    console.log(`Preview ${id}`);
    // TODO: Open preview modal
  };

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const criticalCount = approvals.filter(
    (a) => a.status === "pending" && a.riskLevel === "critical"
  ).length;
  const highRiskCount = approvals.filter(
    (a) => a.status === "pending" && a.riskLevel === "high"
  ).length;
  const avgConfidence =
    approvals.length > 0
      ? approvals.reduce((sum, a) => sum + a.confidence, 0) / approvals.length
      : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Approval Queue
        </h1>
        <p className="text-muted-foreground">
          Review and approve AI-generated changes before deployment
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Pending Review</span>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs">High Risk</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {highRiskCount + criticalCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold">
              {(avgConfidence * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Approved Today</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {approvals.filter((a) => a.status === "approved").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-500">
                {criticalCount} Critical {criticalCount === 1 ? "Item" : "Items"} Require Immediate Attention
              </p>
              <p className="text-sm text-muted-foreground">
                These items have been flagged as critical risk and should be reviewed carefully
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Queue */}
      <ApprovalQueue
        items={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onPreview={handlePreview}
      />
    </div>
  );
}
