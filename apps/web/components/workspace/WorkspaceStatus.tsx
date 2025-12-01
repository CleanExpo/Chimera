"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FolderGit2,
  FolderOpen,
  GitBranch,
  FileCode,
  Package,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";

/**
 * Compact workspace status indicator for the header
 */
export function WorkspaceStatus() {
  const {
    activeProject,
    activeContext,
    hasActiveProject,
    closeProject,
    refreshContext,
    isLoading,
  } = useWorkspace();

  if (!hasActiveProject) {
    return (
      <ProjectSelector
        trigger={
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Open Project</span>
          </Button>
        }
      />
    );
  }

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 max-w-[200px]"
          >
            <FolderGit2 className="h-4 w-4 text-primary" />
            <span className="truncate">{activeProject?.name}</span>
            {activeContext?.hasUncommittedChanges && (
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            {/* Project Name */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{activeProject?.name}</h4>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[220px]">
                  {activeProject?.path}
                </p>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={refreshContext}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={closeProject}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close Project</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Quick Stats */}
            {activeContext && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span>{activeContext.sourceFiles} source files</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{activeContext.dependencies.length} deps</span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {activeContext?.framework && (
                <Badge variant="secondary">{activeContext.framework}</Badge>
              )}
              {activeContext?.language && (
                <Badge variant="outline">{activeContext.language}</Badge>
              )}
              {activeContext?.packageManager && (
                <Badge variant="outline">{activeContext.packageManager}</Badge>
              )}
            </div>

            {/* Git Status */}
            {activeContext?.hasGit && (
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-mono">{activeContext.gitBranch}</span>
                </div>
                {activeContext.hasUncommittedChanges && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Uncommitted changes
                  </Badge>
                )}
              </div>
            )}

            {/* Change Project */}
            <div className="border-t pt-3">
              <ProjectSelector
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Change Project
                  </Button>
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
