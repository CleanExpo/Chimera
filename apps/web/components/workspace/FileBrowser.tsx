"use client";

import { useEffect, useState } from "react";
import { useWorkspaceFiles, type FileEntry } from "@/hooks/useWorkspaceFiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Folder,
  File,
  FileCode,
  FileJson,
  FileText,
  ChevronRight,
  ChevronUp,
  RefreshCw,
  Home,
  Loader2,
  AlertCircle,
  Copy,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileBrowserProps {
  onFileSelect?: (file: FileEntry, content: string) => void;
  onPathChange?: (path: string) => void;
  className?: string;
  showActions?: boolean;
  maxHeight?: string;
}

/**
 * File browser component for workspace navigation
 */
export function FileBrowser({
  onFileSelect,
  onPathChange,
  className,
  showActions = true,
  maxHeight = "400px",
}: FileBrowserProps) {
  const {
    files,
    currentPath,
    isLoading,
    error,
    listFiles,
    readFile,
    deleteFile,
    navigateTo,
    navigateUp,
    isWorkspaceReady,
    workspacePath,
  } = useWorkspaceFiles();

  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileEntry | null>(null);

  // Load files when workspace becomes ready
  useEffect(() => {
    if (isWorkspaceReady) {
      listFiles(".");
    }
  }, [isWorkspaceReady, listFiles]);

  // Notify parent of path changes
  useEffect(() => {
    onPathChange?.(currentPath);
  }, [currentPath, onPathChange]);

  const handleEntryClick = async (entry: FileEntry) => {
    if (entry.type === "directory") {
      await navigateTo(entry.path);
    } else {
      setSelectedFile(entry);
      if (onFileSelect) {
        const content = await readFile(entry.path);
        if (content) {
          onFileSelect(entry, content.content);
        }
      }
    }
  };

  const handlePreview = async (entry: FileEntry) => {
    const content = await readFile(entry.path);
    if (content) {
      setPreviewContent(content.content);
      setPreviewOpen(true);
    }
  };

  const handleDelete = (entry: FileEntry) => {
    setFileToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete.path);
      setFileToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCopyPath = (entry: FileEntry) => {
    const fullPath = `${workspacePath}/${entry.path}`.replace(/\\/g, "/");
    navigator.clipboard.writeText(fullPath);
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === "directory") {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }

    const ext = entry.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case "json":
        return <FileJson className="h-4 w-4 text-green-500" />;
      case "md":
      case "txt":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const breadcrumbs = currentPath === "." ? [] : currentPath.split("/");

  if (!isWorkspaceReady) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)}>
        <AlertCircle className="h-5 w-5 mr-2" />
        No workspace selected
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateTo(".")}
          disabled={currentPath === "."}
        >
          <Home className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateUp}
          disabled={currentPath === "."}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
          <button
            onClick={() => navigateTo(".")}
            className="hover:text-foreground"
          >
            {workspacePath.split(/[/\\]/).pop()}
          </button>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() =>
                  navigateTo(breadcrumbs.slice(0, index + 1).join("/"))
                }
                className="hover:text-foreground"
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => listFiles(currentPath)}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* File List */}
      <ScrollArea style={{ maxHeight }}>
        {isLoading && files.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Empty directory
          </div>
        ) : (
          <div className="divide-y">
            {files.map((entry) => (
              <ContextMenu key={entry.path}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer",
                      selectedFile?.path === entry.path && "bg-muted"
                    )}
                    onClick={() => handleEntryClick(entry)}
                  >
                    {getFileIcon(entry)}
                    <span className="flex-1 truncate text-sm">{entry.name}</span>
                    {entry.type === "file" && entry.size !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {formatSize(entry.size)}
                      </span>
                    )}
                    {entry.type === "directory" && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </ContextMenuTrigger>
                {showActions && (
                  <ContextMenuContent>
                    {entry.type === "file" && (
                      <>
                        <ContextMenuItem onClick={() => handlePreview(entry)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                      </>
                    )}
                    <ContextMenuItem onClick={() => handleCopyPath(entry)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Path
                    </ContextMenuItem>
                    {entry.type === "file" && (
                      <ContextMenuItem
                        onClick={() => handleDelete(entry)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                )}
              </ContextMenu>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto">
              {previewContent}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
