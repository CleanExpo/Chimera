"use client";

import { useState } from "react";
import { useVSCode } from "@/hooks/useVSCode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  FolderOpen,
  FileCode,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VSCodeButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showDropdown?: boolean;
  file?: string;
  line?: number;
}

/**
 * Button to open files/workspace in VS Code
 */
export function VSCodeButton({
  className,
  variant = "outline",
  size = "sm",
  showDropdown = true,
  file,
  line,
}: VSCodeButtonProps) {
  const {
    status,
    isLoading,
    error,
    openWorkspace,
    openFile,
    isAvailable,
  } = useVSCode();

  const [isOpening, setIsOpening] = useState(false);

  const handleOpenWorkspace = async () => {
    setIsOpening(true);
    try {
      await openWorkspace();
    } finally {
      setIsOpening(false);
    }
  };

  const handleOpenFile = async () => {
    if (!file) return;
    setIsOpening(true);
    try {
      await openFile(file, { line });
    } finally {
      setIsOpening(false);
    }
  };

  // If file is specified, just show a simple button
  if (file && !showDropdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn("gap-2", className)}
              onClick={handleOpenFile}
              disabled={!isAvailable || isOpening}
            >
              {isOpening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
              {size !== "icon" && "Open in VS Code"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isAvailable
              ? `Open ${file} in VS Code`
              : "VS Code not available"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show dropdown with options
  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
            disabled={!isAvailable || isOpening}
          >
            {isOpening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}
            {size !== "icon" && (
              <>
                VS Code
                <ChevronDown className="h-3 w-3 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center justify-between">
            VS Code Integration
            {status?.version && (
              <Badge variant="outline" className="text-xs">
                v{status.version.split(" ")[0]}
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleOpenWorkspace} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Open Workspace</span>
              <span className="text-xs text-muted-foreground">
                Open project folder
              </span>
            </div>
          </DropdownMenuItem>

          {file && (
            <DropdownMenuItem onClick={handleOpenFile} className="gap-2">
              <FileCode className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Open File</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {file}
                </span>
              </div>
            </DropdownMenuItem>
          )}

          {!isAvailable && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                VS Code not found in PATH
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple button for workspace
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
            onClick={handleOpenWorkspace}
            disabled={!isAvailable || isOpening}
          >
            {isOpening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}
            {size !== "icon" && "Open in VS Code"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isAvailable ? "Open workspace in VS Code" : "VS Code not available"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
