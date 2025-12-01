"use client";

import { useEffect, useState } from "react";
import { useWorkspaceGit, type GitChange, type GitCommit } from "@/hooks/useWorkspaceGit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  GitPullRequest,
  Plus,
  Minus,
  RefreshCw,
  Upload,
  Download,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileText,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface GitPanelProps {
  className?: string;
}

/**
 * Git panel for workspace operations
 */
export function GitPanel({ className }: GitPanelProps) {
  const {
    status,
    isLoading,
    error,
    getStatus,
    getLog,
    addFiles,
    commit,
    push,
    pull,
    isGitReady,
    hasChanges,
    hasStagedChanges,
  } = useWorkspaceGit();

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState("");
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [commitLog, setCommitLog] = useState<GitCommit[]>([]);

  // Load status on mount and when git is ready
  useEffect(() => {
    if (isGitReady) {
      getStatus();
      loadLog();
    }
  }, [isGitReady, getStatus]);

  const loadLog = async () => {
    const log = await getLog(10);
    setCommitLog(log);
  };

  const handleSelectFile = (file: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(file);
    } else {
      newSelected.delete(file);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (!status) return;
    if (selectedFiles.size === status.changes.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(status.changes.map((c) => c.file)));
    }
  };

  const handleStageSelected = async () => {
    if (selectedFiles.size === 0) return;
    await addFiles(Array.from(selectedFiles));
    setSelectedFiles(new Set());
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    setIsCommitting(true);
    try {
      const result = await commit(commitMessage);
      if (result.success) {
        setCommitMessage("");
        setCommitDialogOpen(false);
        await loadLog();
      }
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      await push();
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      await pull();
    } finally {
      setIsPulling(false);
    }
  };

  const getChangeIcon = (change: GitChange) => {
    if (change.status === "??") {
      return <Plus className="h-4 w-4 text-green-500" />;
    }
    if (change.status.includes("D")) {
      return <Minus className="h-4 w-4 text-red-500" />;
    }
    if (change.status.includes("M")) {
      return <FileText className="h-4 w-4 text-yellow-500" />;
    }
    if (change.status.includes("A")) {
      return <Plus className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  if (!isGitReady) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          No git repository available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Git Operations
            </CardTitle>
            <CardDescription>
              {status?.branch && (
                <span className="font-mono">
                  On branch: <strong>{status.branch}</strong>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => getStatus()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePull}
              disabled={isPulling || isLoading}
            >
              {isPulling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Pull</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePush}
              disabled={isPushing || isLoading}
            >
              {isPushing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Push</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Tabs defaultValue="changes">
          <TabsList>
            <TabsTrigger value="changes" className="gap-1">
              <FileText className="h-4 w-4" />
              Changes
              {hasChanges && (
                <Badge variant="secondary" className="ml-1">
                  {status?.changes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="changes" className="space-y-4">
            {/* Status Summary */}
            {status && (
              <div className="flex flex-wrap gap-2">
                {status.staged > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {status.staged} staged
                  </Badge>
                )}
                {status.unstaged > 0 && (
                  <Badge variant="secondary">
                    {status.unstaged} modified
                  </Badge>
                )}
                {status.untracked > 0 && (
                  <Badge variant="outline">{status.untracked} untracked</Badge>
                )}
                {status.clean && (
                  <Badge variant="outline" className="text-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Clean
                  </Badge>
                )}
              </div>
            )}

            {/* Changes List */}
            {hasChanges ? (
              <>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedFiles.size === status?.changes.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStageSelected}
                    disabled={selectedFiles.size === 0}
                  >
                    Stage Selected ({selectedFiles.size})
                  </Button>
                </div>

                <ScrollArea className="h-48 border rounded-lg">
                  <div className="divide-y">
                    {status?.changes.map((change) => (
                      <div
                        key={change.file}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedFiles.has(change.file)}
                          onCheckedChange={(checked) =>
                            handleSelectFile(change.file, !!checked)
                          }
                        />
                        {getChangeIcon(change)}
                        <span className="flex-1 truncate text-sm font-mono">
                          {change.file}
                        </span>
                        {change.staged && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            Staged
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Commit Button */}
                <Button
                  className="w-full"
                  onClick={() => setCommitDialogOpen(true)}
                  disabled={!hasStagedChanges}
                >
                  <GitCommitIcon className="h-4 w-4 mr-2" />
                  Commit Staged Changes
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Check className="h-8 w-8 mb-2 text-green-500" />
                <p>No changes to commit</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {commitLog.map((commit) => (
                  <div
                    key={commit.hash}
                    className="p-3 border rounded-lg space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <GitCommitIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{commit.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{commit.authorName}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(commit.date), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {commit.hash.substring(0, 7)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {commitLog.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    No commit history
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Commit Dialog */}
      <Dialog open={commitDialogOpen} onOpenChange={setCommitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription>
              {status?.staged} file(s) staged for commit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isCommitting}
            >
              {isCommitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Committing...
                </>
              ) : (
                <>
                  <GitCommitIcon className="h-4 w-4 mr-2" />
                  Commit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
