"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, RotateCcw, Download, Github } from "lucide-react";
import { TeamType } from "./TeamChannel";

interface DecisionDeskProps {
  hasAnthropicOutput: boolean;
  hasGoogleOutput: boolean;
  onApprove: (team: TeamType) => void;
  onReject: () => void;
  onRetry: () => void;
  onExport: (team: TeamType) => void;
  isProcessing?: boolean;
}

export function DecisionDesk({
  hasAnthropicOutput,
  hasGoogleOutput,
  onApprove,
  onReject,
  onRetry,
  onExport,
  isProcessing = false,
}: DecisionDeskProps) {
  const hasAnyOutput = hasAnthropicOutput || hasGoogleOutput;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Decision Desk</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review outputs and approve for deployment
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {/* Approval Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              disabled={!hasAnthropicOutput || isProcessing}
              onClick={() => onApprove("anthropic")}
            >
              <Check className="h-4 w-4" />
              Approve Anthropic
            </Button>
            <Button
              variant="default"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={!hasGoogleOutput || isProcessing}
              onClick={() => onApprove("google")}
            >
              <Check className="h-4 w-4" />
              Approve Google
            </Button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!hasAnyOutput || isProcessing}
              onClick={onReject}
            >
              <X className="h-4 w-4" />
              Reject All
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isProcessing}
              onClick={onRetry}
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={!hasAnthropicOutput || isProcessing}
              onClick={() => onExport("anthropic")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={!hasAnyOutput || isProcessing}
            >
              <Github className="h-4 w-4" />
              Push to Repo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DecisionDesk;
