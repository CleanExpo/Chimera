"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, RefreshCw } from "lucide-react";
import { useJobHistory } from "@/hooks/useJobHistory";
import { JobCard } from "./JobCard";
import { type OrchestrationStatus, type TargetFramework } from "@/lib/api/orchestrate";

interface JobHistoryProps {
  onRetry?: (jobId: string) => void;
}

export function JobHistory({ onRetry }: JobHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<OrchestrationStatus | "all">("all");
  const [frameworkFilter, setFrameworkFilter] = useState<TargetFramework | "all">("all");

  const { jobs, isLoading, error, refetch, setFilters, page, total, pageSize, setPage } = useJobHistory({
    page: 1,
    page_size: 10,
  });

  const handleFilterChange = () => {
    setFilters({
      status: statusFilter !== "all" ? statusFilter : undefined,
      framework: frameworkFilter !== "all" ? frameworkFilter : undefined,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              View and manage your past AI generation jobs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as OrchestrationStatus | "all");
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="awaiting">Awaiting</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="dispatching">Dispatching</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={frameworkFilter}
            onValueChange={(value) => {
              setFrameworkFilter(value as TargetFramework | "all");
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="svelte">Svelte</SelectItem>
              <SelectItem value="vanilla">Vanilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No jobs found</p>
            <p className="text-sm mt-2">
              {statusFilter !== "all" || frameworkFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by creating a new job in the Command Center"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} onRetry={onRetry} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} jobs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
