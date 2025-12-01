"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Coins, TrendingUp, AlertTriangle } from "lucide-react";

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

interface CostTrackerProps {
  tokenUsage: TokenUsage;
  costUsd: number;
  dailyLimit?: number;
  tokenLimit?: number;
}

// Cost per million tokens (approximate)
const MODEL_COSTS = {
  "claude-opus": { input: 15, output: 75 },
  "claude-sonnet": { input: 3, output: 15 },
  "claude-haiku": { input: 0.25, output: 1.25 },
  "gemini-pro": { input: 0.5, output: 1.5 },
};

export function CostTracker({
  tokenUsage,
  costUsd,
  dailyLimit = 50,
  tokenLimit = 1000000,
}: CostTrackerProps) {
  const costPercentage = useMemo(() => {
    return Math.min((costUsd / dailyLimit) * 100, 100);
  }, [costUsd, dailyLimit]);

  const tokenPercentage = useMemo(() => {
    return Math.min((tokenUsage.total / tokenLimit) * 100, 100);
  }, [tokenUsage.total, tokenLimit]);

  const isNearLimit = costPercentage > 80 || tokenPercentage > 80;
  const isOverLimit = costPercentage >= 100 || tokenPercentage >= 100;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Usage & Cost</CardTitle>
          {isOverLimit ? (
            <Badge variant="destructive">Limit Reached</Badge>
          ) : isNearLimit ? (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Near Limit
            </Badge>
          ) : null}
        </div>
        <CardDescription>Today&apos;s resource consumption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span>Cost</span>
            </div>
            <span className="font-mono">
              ${costUsd.toFixed(2)} / ${dailyLimit.toFixed(0)}
            </span>
          </div>
          <Progress
            value={costPercentage}
            className={`h-2 ${isOverLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : ""}`}
          />
        </div>

        {/* Token Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-blue-500" />
              <span>Tokens</span>
            </div>
            <span className="font-mono">
              {formatNumber(tokenUsage.total)} / {formatNumber(tokenLimit)}
            </span>
          </div>
          <Progress
            value={tokenPercentage}
            className={`h-2 ${isOverLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : ""}`}
          />
        </div>

        {/* Token Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Input Tokens
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {formatNumber(tokenUsage.input)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 rotate-180" />
              Output Tokens
            </div>
            <p className="mt-1 font-mono text-lg font-semibold">
              {formatNumber(tokenUsage.output)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Estimate cost based on token usage and model
 */
export function estimateCost(
  tokens: TokenUsage,
  model: keyof typeof MODEL_COSTS = "claude-sonnet"
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (tokens.input / 1000000) * costs.input;
  const outputCost = (tokens.output / 1000000) * costs.output;
  return inputCost + outputCost;
}
