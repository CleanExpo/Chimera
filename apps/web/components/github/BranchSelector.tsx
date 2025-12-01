/**
 * GitHub Branch Selector
 *
 * Allows users to select an existing branch or create a new one.
 */

"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listBranches } from "@/lib/github/client";
import type { GitHubBranch } from "@/lib/github/types";
import { Loader2, GitBranch, Plus } from "lucide-react";

interface BranchSelectorProps {
  accessToken: string;
  owner: string;
  repo: string;
  value?: string;
  onValueChange: (branchName: string, isNew: boolean, baseBranch?: string) => void;
  disabled?: boolean;
}

export function BranchSelector({
  accessToken,
  owner,
  repo,
  value,
  onValueChange,
  disabled = false,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [baseBranch, setBaseBranch] = useState<string>("");

  useEffect(() => {
    async function loadBranches() {
      if (!owner || !repo) return;

      setLoading(true);
      setError(null);

      try {
        const branchList = await listBranches(accessToken, owner, repo);
        setBranches(branchList);

        // Set default base branch to the first branch (usually main/master)
        if (branchList.length > 0) {
          setBaseBranch(branchList[0].name);
        }
      } catch (err) {
        console.error("[BranchSelector] Error loading branches:", err);
        setError(err instanceof Error ? err.message : "Failed to load branches");
      } finally {
        setLoading(false);
      }
    }

    loadBranches();
  }, [accessToken, owner, repo]);

  const handleValueChange = (branchName: string) => {
    onValueChange(branchName, false);
  };

  const handleCreateNewBranch = () => {
    if (newBranchName.trim()) {
      onValueChange(newBranchName.trim(), true, baseBranch);
      setShowNewBranch(false);
      setNewBranchName("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading branches...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Error: {error}
      </div>
    );
  }

  if (showNewBranch) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-branch-name">New Branch Name</Label>
          <Input
            id="new-branch-name"
            placeholder="feature/my-new-feature"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base-branch">Create from Branch</Label>
          <Select value={baseBranch} onValueChange={setBaseBranch} disabled={disabled}>
            <SelectTrigger id="base-branch">
              <SelectValue placeholder="Select base branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {branches.map((branch) => (
                  <SelectItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCreateNewBranch}
            disabled={!newBranchName.trim() || disabled}
          >
            Create Branch
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowNewBranch(false);
              setNewBranchName("");
            }}
            disabled={disabled}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Existing Branches</SelectLabel>
            {branches.map((branch) => (
              <SelectItem key={branch.name} value={branch.name}>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>{branch.name}</span>
                  {branch.protected && (
                    <span className="text-xs text-muted-foreground">(protected)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setShowNewBranch(true)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        Create New Branch
      </Button>
    </div>
  );
}
