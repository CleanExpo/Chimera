"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  FolderGit2,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Code,
  FileCode,
  GitBranch,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectSelectorProps {
  trigger?: React.ReactNode;
}

export function ProjectSelector({ trigger }: ProjectSelectorProps) {
  const {
    activeProject,
    recentProjects,
    isLoading,
    error,
    openProject,
    closeProject,
    removeFromRecent,
  } = useWorkspace();

  const [open, setOpen] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenProject = async () => {
    if (!projectPath.trim()) return;

    setIsOpening(true);
    const success = await openProject(projectPath.trim());
    setIsOpening(false);

    if (success) {
      setProjectPath("");
      setOpen(false);
    }
  };

  const handleSelectRecent = async (path: string) => {
    setIsOpening(true);
    const success = await openProject(path);
    setIsOpening(false);

    if (success) {
      setOpen(false);
    }
  };

  const getFrameworkIcon = (framework?: string) => {
    // Could add specific icons per framework
    return <Code className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {activeProject ? activeProject.name : "Open Project"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Workspace</DialogTitle>
          <DialogDescription>
            Open a project to work on. All AI operations will be scoped to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Project */}
          {activeProject && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Active Project
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeProject}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <FolderGit2 className="mt-1 h-10 w-10 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{activeProject.name}</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {activeProject.path}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeProject.framework && (
                        <Badge variant="secondary">{activeProject.framework}</Badge>
                      )}
                      {activeProject.language && (
                        <Badge variant="outline">{activeProject.language}</Badge>
                      )}
                      {activeProject.gitBranch && (
                        <Badge variant="outline" className="gap-1">
                          <GitBranch className="h-3 w-3" />
                          {activeProject.gitBranch}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Open New Project */}
          <div className="space-y-3">
            <Label htmlFor="project-path">Open Project Directory</Label>
            <div className="flex gap-2">
              <Input
                id="project-path"
                placeholder="D:\Projects\my-app or /Users/me/projects/my-app"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenProject()}
                className="font-mono"
              />
              <Button
                onClick={handleOpenProject}
                disabled={!projectPath.trim() || isOpening}
              >
                {isOpening ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div className="space-y-3">
              <Label>Recent Projects</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => handleSelectRecent(project.path)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <FileCode className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{project.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {project.path}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.framework && (
                          <Badge variant="secondary" className="text-xs">
                            {project.framework}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.lastOpened), {
                            addSuffix: true,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromRecent(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!activeProject && recentProjects.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">No Projects Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Enter a project path above to start working. Chimera will analyze
                  the project and provide AI-powered assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
