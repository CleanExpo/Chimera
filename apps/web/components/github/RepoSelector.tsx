/**
 * GitHub Repository Selector
 *
 * Allows users to select a repository from their GitHub account.
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
import { listRepositories } from "@/lib/github/client";
import type { GitHubRepository } from "@/lib/github/types";
import { Loader2, GitBranch } from "lucide-react";

interface RepoSelectorProps {
  accessToken: string;
  value?: string;
  onValueChange: (repoFullName: string, repo: GitHubRepository) => void;
  disabled?: boolean;
}

export function RepoSelector({
  accessToken,
  value,
  onValueChange,
  disabled = false,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepos() {
      setLoading(true);
      setError(null);

      try {
        const repositories = await listRepositories(accessToken, {
          type: "owner",
          sort: "updated",
          per_page: 100,
        });

        setRepos(repositories);
      } catch (err) {
        console.error("[RepoSelector] Error loading repos:", err);
        setError(err instanceof Error ? err.message : "Failed to load repositories");
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      loadRepos();
    }
  }, [accessToken]);

  const handleValueChange = (repoFullName: string) => {
    const selectedRepo = repos.find((r) => r.full_name === repoFullName);
    if (selectedRepo) {
      onValueChange(repoFullName, selectedRepo);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading repositories...
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

  if (repos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No repositories found. Create a repository on GitHub first.
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a repository" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Your Repositories</SelectLabel>
          {repos.map((repo) => (
            <SelectItem key={repo.id} value={repo.full_name}>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{repo.name}</span>
                  {repo.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {repo.description}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
