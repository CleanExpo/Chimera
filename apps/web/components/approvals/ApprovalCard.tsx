"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Brain,
  Code2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
} from "lucide-react";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_review";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ReasoningStep {
  id: string;
  step: string;
  explanation: string;
  confidence: number;
}

export interface ApprovalItem {
  id: string;
  jobId: string;
  title: string;
  description: string;
  type: "code_generation" | "deployment" | "config_change" | "database_migration";
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  confidence: number;
  requestedAt: string;
  requestedBy: string;
  reasoning: ReasoningStep[];
  affectedFiles?: string[];
  preview?: string;
}

interface ApprovalCardProps {
  item: ApprovalItem;
  onApprove: (id: string, feedback?: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestChanges: (id: string, changes: string) => void;
  onPreview?: (id: string) => void;
}

const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string }> = {
  low: { color: "text-green-500", bgColor: "bg-green-500/10", label: "Low Risk" },
  medium: { color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Medium Risk" },
  high: { color: "text-orange-500", bgColor: "bg-orange-500/10", label: "High Risk" },
  critical: { color: "text-red-500", bgColor: "bg-red-500/10", label: "Critical" },
};

const typeConfig = {
  code_generation: { icon: Code2, label: "Code Generation" },
  deployment: { icon: RefreshCw, label: "Deployment" },
  config_change: { icon: AlertTriangle, label: "Config Change" },
  database_migration: { icon: Brain, label: "DB Migration" },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.9) return "bg-green-500";
    if (confidence >= 0.7) return "bg-yellow-500";
    if (confidence >= 0.5) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all", getColor())}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium">{(confidence * 100).toFixed(0)}%</span>
    </div>
  );
}

export function ApprovalCard({
  item,
  onApprove,
  onReject,
  onRequestChanges,
  onPreview,
}: ApprovalCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const risk = riskConfig[item.riskLevel];
  const type = typeConfig[item.type];
  const TypeIcon = type.icon;

  const handleApprove = () => {
    onApprove(item.id, feedback || undefined);
    setFeedback("");
    setShowFeedback(false);
  };

  const handleReject = () => {
    if (!feedback) {
      setShowFeedback(true);
      return;
    }
    onReject(item.id, feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  const handleRequestChanges = () => {
    if (!feedback) {
      setShowFeedback(true);
      return;
    }
    onRequestChanges(item.id, feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  return (
    <Card className={cn(
      "transition-all",
      item.status === "pending" && item.riskLevel === "critical" && "border-red-500/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", risk.bgColor)}>
              <TypeIcon className={cn("h-5 w-5", risk.color)} />
            </div>
            <div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={risk.color}>
              {risk.label}
            </Badge>
            <Badge variant="secondary">{type.label}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">AI Confidence</span>
            <span className="text-xs text-muted-foreground">
              Requested {new Date(item.requestedAt).toLocaleString()}
            </span>
          </div>
          <ConfidenceBar confidence={item.confidence} />
        </div>

        {/* Affected Files */}
        {item.affectedFiles && item.affectedFiles.length > 0 && (
          <div>
            <span className="text-sm font-medium">Affected Files</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.affectedFiles.slice(0, 5).map((file) => (
                <Badge key={file} variant="outline" className="text-xs font-mono">
                  {file}
                </Badge>
              ))}
              {item.affectedFiles.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{item.affectedFiles.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Reasoning Chain */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setShowReasoning(!showReasoning)}
          >
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Reasoning Chain ({item.reasoning.length} steps)
            </span>
            {showReasoning ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showReasoning && (
            <ScrollArea className="h-[200px] mt-2 rounded-lg border p-3">
              <div className="space-y-3">
                {item.reasoning.map((step, index) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.step}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.explanation}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {(step.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Feedback Input */}
        {showFeedback && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add feedback or reason..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t">
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={() => onPreview(item.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedback(!showFeedback)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showFeedback ? "Hide" : "Add"} Feedback
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestChanges}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button size="sm" onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
