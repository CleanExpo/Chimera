/**
 * GitHub Push Dialog
 *
 * Modal dialog for configuring and pushing code to GitHub.
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepoSelector } from "./RepoSelector";
import { BranchSelector } from "./BranchSelector";
import { pushToRepo } from "@/lib/github/client";
import type { GitHubRepository } from "@/lib/github/types";
import { Loader2, Github, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  code: string;
  fileName: string;
  defaultCommitMessage?: string;
}

type PushStatus = "idle" | "pushing" | "success" | "error";

export function PushDialog({
  open,
  onOpenChange,
  accessToken,
  code,
  fileName,
  defaultCommitMessage = "feat: Add component from Chimera",
}: PushDialogProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isNewBranch, setIsNewBranch] = useState(false);
  const [baseBranch, setBaseBranch] = useState<string>("");
  const [filePath, setFilePath] = useState<string>(fileName);
  const [commitMessage, setCommitMessage] = useState<string>(defaultCommitMessage);
  const [status, setStatus] = useState<PushStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pushedFileUrl, setPushedFileUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRepoChange = (repoFullName: string, repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setSelectedBranch(""); // Reset branch when repo changes
  };

  const handleBranchChange = (branchName: string, isNew: boolean, base?: string) => {
    setSelectedBranch(branchName);
    setIsNewBranch(isNew);
    if (base) {
      setBaseBranch(base);
    }
  };

  const handlePush = async () => {
    if (!selectedRepo || !selectedBranch || !filePath || !commitMessage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setStatus("pushing");
    setError(null);

    try {
      const result = await pushToRepo(accessToken, {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: selectedBranch,
        path: filePath,
        content: code,
        message: commitMessage,
        createBranch: isNewBranch,
        baseBranch: isNewBranch ? baseBranch : undefined,
      });

      setStatus("success");
      setPushedFileUrl(result.content.html_url);

      toast({
        title: "Successfully Pushed!",
        description: `Code pushed to ${selectedRepo.full_name}`,
      });

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("[PushDialog] Push failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to push to GitHub";
      setError(errorMessage);
      setStatus("error");

      toast({
        title: "Push Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setSelectedRepo(null);
    setSelectedBranch("");
    setIsNewBranch(false);
    setBaseBranch("");
    setFilePath(fileName);
    setCommitMessage(defaultCommitMessage);
    setStatus("idle");
    setError(null);
    setPushedFileUrl(null);
    onOpenChange(false);
  };

  const canPush =
    selectedRepo &&
    selectedBranch &&
    filePath.trim() &&
    commitMessage.trim() &&
    status !== "pushing";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Push to GitHub Repository
          </DialogTitle>
          <DialogDescription>
            Configure where to push your generated code. The file will be committed to your
            selected repository and branch.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Successfully Pushed!</h3>
              <p className="text-sm text-muted-foreground">
                Your code has been pushed to {selectedRepo?.full_name}
              </p>
              {pushedFileUrl && (
                <a
                  href={pushedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline inline-block"
                >
                  View on GitHub →
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Repository Selection */}
            <div className="space-y-2">
              <Label htmlFor="repo-select">Repository</Label>
              <RepoSelector
                accessToken={accessToken}
                value={selectedRepo?.full_name}
                onValueChange={handleRepoChange}
                disabled={status === "pushing"}
              />
            </div>

            {/* Branch Selection */}
            {selectedRepo && (
              <div className="space-y-2">
                <Label htmlFor="branch-select">Branch</Label>
                <BranchSelector
                  accessToken={accessToken}
                  owner={selectedRepo.owner.login}
                  repo={selectedRepo.name}
                  value={selectedBranch}
                  onValueChange={handleBranchChange}
                  disabled={status === "pushing"}
                />
              </div>
            )}

            {/* File Path */}
            <div className="space-y-2">
              <Label htmlFor="file-path">File Path</Label>
              <Input
                id="file-path"
                placeholder="src/components/MyComponent.tsx"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                disabled={status === "pushing"}
              />
              <p className="text-xs text-muted-foreground">
                Path where the file will be created in the repository
              </p>
            </div>

            {/* Commit Message */}
            <div className="space-y-2">
              <Label htmlFor="commit-message">Commit Message</Label>
              <Input
                id="commit-message"
                placeholder="feat: Add component from Chimera"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                disabled={status === "pushing"}
              />
            </div>

            {/* Error Display */}
            {status === "error" && error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {status === "success" ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={status === "pushing"}>
                Cancel
              </Button>
              <Button onClick={handlePush} disabled={!canPush}>
                {status === "pushing" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {status === "pushing" ? "Pushing..." : "Push to GitHub"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
