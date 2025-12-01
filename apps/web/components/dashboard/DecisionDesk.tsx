"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, RotateCcw, Download, Github, ChevronDown, Copy, FileCode, Package, Link2, FolderGit2 } from "lucide-react";
import { TeamType } from "./TeamChannel";
import { Framework } from "@/lib/utils/export";
import { PushDialog } from "@/components/github";
import { ApplyCodeDialog } from "@/components/workspace";
import { useGitHubAuth } from "@/hooks/use-github-auth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface DecisionDeskProps {
  hasAnthropicOutput: boolean;
  hasGoogleOutput: boolean;
  anthropicCode?: string;
  googleCode?: string;
  framework: Framework;
  currentTask?: string;
  onApprove: (team: TeamType) => void;
  onReject: () => void;
  onRetry: () => void;
  onExport: (team: TeamType, format: "single" | "zip" | "clipboard") => void;
  isProcessing?: boolean;
}

export function DecisionDesk({
  hasAnthropicOutput,
  hasGoogleOutput,
  anthropicCode,
  googleCode,
  framework,
  currentTask,
  onApprove,
  onReject,
  onRetry,
  onExport,
  isProcessing = false,
}: DecisionDeskProps) {
  const hasAnyOutput = hasAnthropicOutput || hasGoogleOutput;
  const hasBothOutputs = hasAnthropicOutput && hasGoogleOutput;

  // GitHub integration
  const { isConnected: isGitHubConnected, accessToken, connect: connectGitHub } = useGitHubAuth();
  const { hasActiveProject } = useWorkspace();
  const { toast } = useToast();

  // Push dialog state
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [pushTeam, setPushTeam] = useState<TeamType | null>(null);

  // Apply to workspace dialog state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyTeam, setApplyTeam] = useState<TeamType | null>(null);

  // Get file extension based on framework
  const getFileExtension = () => {
    switch (framework) {
      case "react":
        return "tsx";
      case "vue":
        return "vue";
      case "svelte":
        return "svelte";
      default:
        return "js";
    }
  };

  // Get default filename
  const getDefaultFileName = (team: TeamType) => {
    const taskName = currentTask
      ? currentTask
          .slice(0, 50)
          .replace(/[^a-zA-Z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      : "component";

    return `src/components/${taskName}-${team}.${getFileExtension()}`;
  };

  // Handle push to repo button click
  const handlePushToRepo = (team: TeamType) => {
    if (!isGitHubConnected) {
      // Show toast and connect to GitHub
      toast({
        title: "Connect to GitHub",
        description: "You need to connect your GitHub account first.",
      });
      connectGitHub();
      return;
    }

    // Open push dialog
    setPushTeam(team);
    setPushDialogOpen(true);
  };

  // Get code for the selected team
  const getCodeForTeam = (team: TeamType) => {
    return team === "anthropic" ? anthropicCode : googleCode;
  };

  // Handle apply to workspace button click
  const handleApplyToWorkspace = (team: TeamType) => {
    if (!hasActiveProject) {
      toast({
        title: "No Workspace Selected",
        description: "Please open a project workspace first.",
      });
      return;
    }
    setApplyTeam(team);
    setApplyDialogOpen(true);
  };

  // Handle successful apply
  const handleApplySuccess = (filePath: string) => {
    toast({
      title: "Code Applied",
      description: `Saved to ${filePath}`,
    });
  };

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
            {/* Anthropic Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={!hasAnthropicOutput || isProcessing}
                >
                  <Download className="h-4 w-4" />
                  Export Anthropic
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onExport("anthropic", "single")}
                  className="gap-2"
                >
                  <FileCode className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Single File</span>
                    <span className="text-xs text-muted-foreground">
                      Download as .{framework === "react" ? "tsx" : framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : "js"}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExport("anthropic", "clipboard")}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Copy to Clipboard</span>
                    <span className="text-xs text-muted-foreground">
                      Copy code to clipboard
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleApplyToWorkspace("anthropic")}
                  className="gap-2"
                >
                  <FolderGit2 className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Apply to Workspace</span>
                    <span className="text-xs text-muted-foreground">
                      {hasActiveProject ? "Save to project" : "Open project first"}
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Google Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={!hasGoogleOutput || isProcessing}
                >
                  <Download className="h-4 w-4" />
                  Export Google
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onExport("google", "single")}
                  className="gap-2"
                >
                  <FileCode className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Single File</span>
                    <span className="text-xs text-muted-foreground">
                      Download as .{framework === "react" ? "tsx" : framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : "js"}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExport("google", "clipboard")}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Copy to Clipboard</span>
                    <span className="text-xs text-muted-foreground">
                      Copy code to clipboard
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleApplyToWorkspace("google")}
                  className="gap-2"
                >
                  <FolderGit2 className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Apply to Workspace</span>
                    <span className="text-xs text-muted-foreground">
                      {hasActiveProject ? "Save to project" : "Open project first"}
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Both as ZIP */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={!hasBothOutputs || isProcessing}
                >
                  <Package className="h-4 w-4" />
                  Export Both
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Both Teams</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onExport("anthropic", "zip")}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>ZIP Package</span>
                    <span className="text-xs text-muted-foreground">
                      Download both teams as ZIP
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Push to Repo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={!hasAnyOutput || isProcessing}
                >
                  <Github className="h-4 w-4" />
                  Push to Repo
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {isGitHubConnected ? "Push to GitHub" : "Connect GitHub"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {!isGitHubConnected && (
                  <DropdownMenuItem
                    onClick={connectGitHub}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Connect GitHub</span>
                      <span className="text-xs text-muted-foreground">
                        Authorize to push code
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                {isGitHubConnected && hasAnthropicOutput && (
                  <DropdownMenuItem
                    onClick={() => handlePushToRepo("anthropic")}
                    className="gap-2"
                  >
                    <Github className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Push Anthropic</span>
                      <span className="text-xs text-muted-foreground">
                        Push to your repository
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                {isGitHubConnected && hasGoogleOutput && (
                  <DropdownMenuItem
                    onClick={() => handlePushToRepo("google")}
                    className="gap-2"
                  >
                    <Github className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Push Google</span>
                      <span className="text-xs text-muted-foreground">
                        Push to your repository
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Push Dialog */}
      {pushTeam && accessToken && (
        <PushDialog
          open={pushDialogOpen}
          onOpenChange={setPushDialogOpen}
          accessToken={accessToken}
          code={getCodeForTeam(pushTeam) || ""}
          fileName={getDefaultFileName(pushTeam)}
          defaultCommitMessage={`feat: Add ${pushTeam} component from Chimera${currentTask ? `\n\n${currentTask}` : ""}`}
        />
      )}

      {/* Apply to Workspace Dialog */}
      {applyTeam && (
        <ApplyCodeDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          code={getCodeForTeam(applyTeam) || ""}
          framework={framework}
          suggestedFileName={
            currentTask
              ? currentTask
                  .slice(0, 30)
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .replace(/^./, (c) => c.toUpperCase())
              : undefined
          }
          onApplied={handleApplySuccess}
        />
      )}
    </Card>
  );
}

export default DecisionDesk;
