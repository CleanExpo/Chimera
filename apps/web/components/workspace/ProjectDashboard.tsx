"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderGit2,
  FolderOpen,
  GitBranch,
  FileCode,
  Package,
  AlertCircle,
  RefreshCw,
  Code,
  FileJson,
  Settings2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";

/**
 * Project Dashboard - Shows detailed information about the active workspace
 */
export function ProjectDashboard() {
  const {
    activeProject,
    activeContext,
    hasActiveProject,
    refreshContext,
    isLoading,
    error,
  } = useWorkspace();

  if (isLoading && !activeProject) {
    return <ProjectDashboardSkeleton />;
  }

  if (!hasActiveProject || !activeProject) {
    return <NoProjectSelected />;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderGit2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{activeProject.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {activeProject.path}
            </p>
            {activeProject.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeProject.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshContext}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <ProjectSelector
            trigger={
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Change
              </Button>
            }
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileCode className="h-5 w-5" />}
          label="Source Files"
          value={activeContext?.sourceFiles ?? 0}
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Dependencies"
          value={activeContext?.dependencies.length ?? 0}
        />
        <StatCard
          icon={<Code className="h-5 w-5" />}
          label="Dev Dependencies"
          value={activeContext?.devDependencies.length ?? 0}
        />
        <StatCard
          icon={<FileCode className="h-5 w-5" />}
          label="Total Files"
          value={activeContext?.totalFiles ?? 0}
        />
      </div>

      {/* Project Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Technology Stack
            </CardTitle>
            <CardDescription>
              Detected frameworks and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {activeContext?.framework && (
                <Badge variant="default" className="text-sm">
                  {activeContext.framework}
                </Badge>
              )}
              {activeContext?.language && (
                <Badge variant="secondary" className="text-sm">
                  {activeContext.language}
                </Badge>
              )}
              {activeContext?.packageManager && (
                <Badge variant="outline" className="text-sm">
                  {activeContext.packageManager}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Project Markers</h4>
              <div className="flex flex-wrap gap-2">
                {activeContext?.hasPackageJson && (
                  <Badge variant="outline" className="gap-1">
                    <FileJson className="h-3 w-3" />
                    package.json
                  </Badge>
                )}
                {activeContext?.hasTsConfig && (
                  <Badge variant="outline" className="gap-1">
                    <Code className="h-3 w-3" />
                    tsconfig.json
                  </Badge>
                )}
                {activeContext?.hasReadme && (
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    README
                  </Badge>
                )}
                {activeContext?.hasGit && (
                  <Badge variant="outline" className="gap-1">
                    <GitBranch className="h-3 w-3" />
                    Git
                  </Badge>
                )}
              </div>
            </div>

            {activeContext?.entryPoints && activeContext.entryPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Entry Points</h4>
                <div className="flex flex-wrap gap-2">
                  {activeContext.entryPoints.map((entry) => (
                    <Badge key={entry} variant="secondary" className="font-mono text-xs">
                      {entry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Git Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Git Information
            </CardTitle>
            <CardDescription>
              Repository status and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeContext?.hasGit ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Branch</span>
                  <Badge variant="secondary" className="font-mono">
                    {activeContext.gitBranch || "unknown"}
                  </Badge>
                </div>

                {activeContext.gitRemote && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remote</span>
                    <a
                      href={activeContext.gitRemote.replace(/\.git$/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on GitHub
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {activeContext.hasUncommittedChanges ? (
                    <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      <AlertCircle className="h-3 w-3" />
                      Uncommitted changes
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Clean
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Not a Git repository</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dependencies List */}
      {activeContext && (activeContext.dependencies.length > 0 || activeContext.devDependencies.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dependencies
            </CardTitle>
            <CardDescription>
              Installed packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {activeContext.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Production ({activeContext.dependencies.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeContext.dependencies.slice(0, 20).map((dep) => (
                      <Badge key={dep} variant="outline" className="font-mono text-xs">
                        {dep}
                      </Badge>
                    ))}
                    {activeContext.dependencies.length > 20 && (
                      <Badge variant="secondary" className="text-xs">
                        +{activeContext.dependencies.length - 20} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {activeContext.devDependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Development ({activeContext.devDependencies.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeContext.devDependencies.slice(0, 20).map((dep) => (
                      <Badge key={dep} variant="outline" className="font-mono text-xs">
                        {dep}
                      </Badge>
                    ))}
                    {activeContext.devDependencies.length > 20 && (
                      <Badge variant="secondary" className="text-xs">
                        +{activeContext.devDependencies.length - 20} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* README Summary */}
      {activeContext?.readmeSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              README Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activeContext.readmeSummary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No project selected state
 */
function NoProjectSelected() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Open a project to see its details, analyze its structure, and start
          working with AI-powered development tools.
        </p>
        <ProjectSelector
          trigger={
            <Button>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Project
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for the dashboard
 */
function ProjectDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
