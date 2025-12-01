"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useGitHubAuth } from "@/hooks/use-github-auth";
import { Github, Link, Unlink, GitBranch, GitPullRequest } from "lucide-react";

export function GitHubSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const { isConnected, user, connect, disconnect, loading } = useGitHubAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to push generated code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
            <div>
              <p className="font-medium">
                {isConnected ? "Connected" : "Not Connected"}
              </p>
              {isConnected && user && (
                <p className="text-sm text-muted-foreground">
                  Signed in as @{user.login}
                </p>
              )}
            </div>
          </div>
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={isConnected ? disconnect : connect}
            disabled={loading}
          >
            {isConnected ? (
              <>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>

        {/* GitHub Settings (only show when connected) */}
        {isConnected && (
          <>
            {/* Default Branch */}
            <div className="space-y-2">
              <Label htmlFor="default-branch" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Default Branch
              </Label>
              <Input
                id="default-branch"
                value={settings.defaultBranch}
                onChange={(e) => updateSettings({ defaultBranch: e.target.value })}
                placeholder="main"
              />
              <p className="text-sm text-muted-foreground">
                Default branch for pushing code
              </p>
            </div>

            {/* Auto Create PR */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-pr" className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4" />
                  Auto-Create Pull Request
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create a PR when pushing to a new branch
                </p>
              </div>
              <Switch
                id="auto-pr"
                checked={settings.autoCreatePR}
                onCheckedChange={(checked) => updateSettings({ autoCreatePR: checked })}
              />
            </div>

            {/* Permissions */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">repo:read</Badge>
                <Badge variant="secondary">repo:write</Badge>
                <Badge variant="secondary">pull_request:write</Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
