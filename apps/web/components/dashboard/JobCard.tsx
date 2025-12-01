"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Copy, RotateCw, Clock, Zap } from "lucide-react";
import { type JobHistoryItem } from "@/lib/api/orchestrate";
import { useJobDetails } from "@/hooks/useJobHistory";
import { CodePreview } from "./CodePreview";

interface JobCardProps {
  job: JobHistoryItem;
  onRetry?: (jobId: string) => void;
}

const statusColors: Record<string, string> = {
  complete: "bg-green-500/10 text-green-500 border-green-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  received: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  planning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  dispatching: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  awaiting: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const frameworkColors: Record<string, string> = {
  react: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  vue: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  svelte: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  vanilla: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export function JobCard({ job, onRetry }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { job: jobDetails, isLoading: detailsLoading } = useJobDetails(
    isExpanded ? job.job_id : null
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    if (!job.completed_at) return "In progress";
    const start = new Date(job.created_at).getTime();
    const end = new Date(job.completed_at).getTime();
    const seconds = Math.floor((end - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show toast notification
      console.log("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base truncate">
                {job.brief_summary}
              </CardTitle>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[job.status] || "bg-gray-500/10"}>
                {job.status}
              </Badge>
              <Badge className={frameworkColors[job.framework] || "bg-gray-500/10"}>
                {job.framework}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(job.created_at)}
              </span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Metrics Preview */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {job.total_tokens.toLocaleString()} tokens
          </div>
          <div>${job.estimated_cost.toFixed(4)}</div>
          <div>{getDuration()}</div>
          <div>{job.teams.length} teams</div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {detailsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : jobDetails ? (
            <>
              {/* Team Outputs */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Generated Code</h4>
                {Object.entries(jobDetails.teams).map(([teamName, teamData]) => (
                  <div key={teamName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {teamName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {teamData.model_used}
                        </span>
                        <Badge className={statusColors[teamData.status] || "bg-gray-500/10"}>
                          {teamData.status}
                        </Badge>
                      </div>
                      {teamData.generated_code && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(teamData.generated_code!)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>

                    {teamData.generated_code && (
                      <div className="max-h-[300px] overflow-hidden">
                        <CodePreview
                          code={teamData.generated_code}
                          language={job.framework}
                          showEditor={true}
                          showConsole={false}
                        />
                      </div>
                    )}

                    {teamData.error_message && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-sm text-red-500">
                        {teamData.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Thought Streams */}
              {Object.entries(jobDetails.teams).some(
                ([, teamData]) => teamData.thoughts.length > 0
              ) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Thought Process</h4>
                  {Object.entries(jobDetails.teams).map(([teamName, teamData]) =>
                    teamData.thoughts.length > 0 ? (
                      <div key={teamName} className="space-y-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {teamName}
                        </Badge>
                        <div className="bg-muted/50 rounded p-3 space-y-1 max-h-40 overflow-y-auto">
                          {teamData.thoughts.map((thought) => (
                            <div key={thought.id} className="text-xs text-muted-foreground">
                              {thought.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(job.job_id)}
                  >
                    <RotateCw className="w-3 h-3 mr-1" />
                    Re-run
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(job.job_id)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Job ID
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Failed to load job details
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
