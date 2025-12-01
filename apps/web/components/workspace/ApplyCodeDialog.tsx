"use client";

import { useState } from "react";
import { useWorkspaceFiles } from "@/hooks/useWorkspaceFiles";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileCode,
  FolderGit2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FileBrowser } from "./FileBrowser";

interface ApplyCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  framework: "react" | "vue" | "svelte" | "vanilla";
  suggestedFileName?: string;
  onApplied?: (filePath: string) => void;
}

/**
 * Dialog for applying generated code to a file in the workspace
 */
export function ApplyCodeDialog({
  open,
  onOpenChange,
  code,
  framework,
  suggestedFileName,
  onApplied,
}: ApplyCodeDialogProps) {
  const { activeProject, hasActiveProject } = useWorkspace();
  const { writeFile, isLoading, error } = useWorkspaceFiles();

  const [fileName, setFileName] = useState(suggestedFileName || "");
  const [targetDir, setTargetDir] = useState("src/components");
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Suggest file extension based on framework
  const getExtension = () => {
    switch (framework) {
      case "react":
        return ".tsx";
      case "vue":
        return ".vue";
      case "svelte":
        return ".svelte";
      default:
        return ".ts";
    }
  };

  // Common target directories
  const commonDirs = [
    "src/components",
    "src/pages",
    "src/features",
    "src/lib",
    "components",
    "pages",
    "app",
    "lib",
  ];

  const handleApply = async () => {
    if (!fileName.trim()) {
      setApplyError("File name is required");
      return;
    }

    setIsApplying(true);
    setApplyError(null);

    try {
      // Ensure file has extension
      let finalFileName = fileName;
      if (!fileName.includes(".")) {
        finalFileName = fileName + getExtension();
      }

      // Build full path
      const filePath = targetDir
        ? `${targetDir}/${finalFileName}`.replace(/\/+/g, "/")
        : finalFileName;

      const success = await writeFile(filePath, code, true);

      if (success) {
        setApplied(true);
        onApplied?.(filePath);

        // Reset after success
        setTimeout(() => {
          setApplied(false);
          onOpenChange(false);
        }, 1500);
      } else {
        setApplyError("Failed to write file");
      }
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply code");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectFromBrowser = (path: string) => {
    // Extract directory from selected path
    const dir = path.includes("/")
      ? path.substring(0, path.lastIndexOf("/"))
      : ".";
    setTargetDir(dir);
  };

  if (!hasActiveProject || !activeProject) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Workspace Selected</DialogTitle>
            <DialogDescription>
              Please open a project workspace before applying generated code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Apply Code to Workspace
          </DialogTitle>
          <DialogDescription>
            Save the generated code to a file in your project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FolderGit2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium">{activeProject.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {activeProject.path}
              </p>
            </div>
            <Badge variant="secondary">{framework}</Badge>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <div className="flex gap-2">
              <Input
                id="fileName"
                placeholder={`ComponentName${getExtension()}`}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Extension will be added automatically if not provided
            </p>
          </div>

          {/* Target Directory */}
          <div className="space-y-2">
            <Label>Target Directory</Label>
            <div className="flex gap-2">
              <Select value={targetDir} onValueChange={setTargetDir}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select directory" />
                </SelectTrigger>
                <SelectContent>
                  {commonDirs.map((dir) => (
                    <SelectItem key={dir} value={dir}>
                      {dir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                placeholder="Custom path"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          {/* File Browser (collapsed by default) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Browse workspace files...
            </summary>
            <div className="mt-2">
              <FileBrowser
                onPathChange={handleSelectFromBrowser}
                maxHeight="200px"
                showActions={false}
              />
            </div>
          </details>

          {/* Preview Path */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Full path:</p>
            <p className="font-mono text-sm">
              {activeProject.path}/
              {targetDir ? `${targetDir}/` : ""}
              {fileName || `ComponentName${getExtension()}`}
            </p>
          </div>

          {/* Code Preview */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Preview code ({code.split("\n").length} lines)...
            </summary>
            <ScrollArea className="h-40 mt-2 border rounded-lg">
              <pre className="text-xs font-mono p-3">{code}</pre>
            </ScrollArea>
          </details>

          {/* Error Display */}
          {(error || applyError) && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4" />
              {error || applyError}
            </div>
          )}

          {/* Success Display */}
          {applied && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">
              <Check className="h-4 w-4" />
              File saved successfully!
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !fileName.trim()}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : applied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Applied!
              </>
            ) : (
              "Apply to Workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
