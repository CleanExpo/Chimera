/**
 * Workspace Git Operations API
 * Provides git operations scoped to the active workspace project
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const execAsync = promisify(exec);

// Execute git command in workspace directory
async function execGit(
  workspacePath: string,
  command: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(`git ${command}`, {
      cwd: workspacePath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    // Git commands often return non-zero exit codes for normal operations
    if (execError.stdout !== undefined || execError.stderr !== undefined) {
      return {
        stdout: execError.stdout || "",
        stderr: execError.stderr || "",
      };
    }
    throw error;
  }
}

// Check if directory is a git repository
async function isGitRepo(workspacePath: string): Promise<boolean> {
  try {
    const gitDir = path.join(workspacePath, ".git");
    const stat = await fs.stat(gitDir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * GET /api/workspace/git
 * Get git status and info
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspacePath = searchParams.get("workspace");
    const action = searchParams.get("action") || "status";

    if (!workspacePath) {
      return NextResponse.json(
        { error: "Workspace path is required" },
        { status: 400 }
      );
    }

    // Validate workspace exists
    try {
      const workspaceStat = await fs.stat(workspacePath);
      if (!workspaceStat.isDirectory()) {
        return NextResponse.json(
          { error: "Workspace path is not a directory" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Workspace directory not found" },
        { status: 404 }
      );
    }

    // Check if it's a git repo
    if (!(await isGitRepo(workspacePath))) {
      return NextResponse.json(
        { error: "Not a git repository" },
        { status: 400 }
      );
    }

    switch (action) {
      case "status": {
        // Get comprehensive git status
        const [statusResult, branchResult, remoteResult, logResult] = await Promise.all([
          execGit(workspacePath, "status --porcelain"),
          execGit(workspacePath, "branch --show-current"),
          execGit(workspacePath, "remote -v"),
          execGit(workspacePath, "log -1 --format=%H|%s|%an|%ae|%ci"),
        ]);

        // Parse status
        const statusLines = statusResult.stdout.trim().split("\n").filter(Boolean);
        const changes = statusLines.map((line) => {
          const status = line.substring(0, 2);
          const file = line.substring(3);
          return {
            file,
            status: status.trim(),
            staged: status[0] !== " " && status[0] !== "?",
            unstaged: status[1] !== " ",
          };
        });

        // Parse remotes
        const remotes: Record<string, { fetch?: string; push?: string }> = {};
        remoteResult.stdout.trim().split("\n").filter(Boolean).forEach((line) => {
          const match = line.match(/^(\S+)\s+(\S+)\s+\((\w+)\)$/);
          if (match) {
            const [, name, url, type] = match;
            if (!remotes[name]) remotes[name] = {};
            remotes[name][type as "fetch" | "push"] = url;
          }
        });

        // Parse last commit
        let lastCommit = null;
        if (logResult.stdout.trim()) {
          const [hash, subject, authorName, authorEmail, date] = logResult.stdout.trim().split("|");
          lastCommit = { hash, subject, authorName, authorEmail, date };
        }

        return NextResponse.json({
          branch: branchResult.stdout.trim(),
          changes,
          staged: changes.filter((c) => c.staged).length,
          unstaged: changes.filter((c) => c.unstaged).length,
          untracked: changes.filter((c) => c.status === "??").length,
          remotes,
          lastCommit,
          clean: changes.length === 0,
        });
      }

      case "log": {
        const limit = searchParams.get("limit") || "10";
        const result = await execGit(
          workspacePath,
          `log -${limit} --format=%H|%s|%an|%ae|%ci`
        );

        const commits = result.stdout.trim().split("\n").filter(Boolean).map((line) => {
          const [hash, subject, authorName, authorEmail, date] = line.split("|");
          return { hash, subject, authorName, authorEmail, date };
        });

        return NextResponse.json({ commits });
      }

      case "diff": {
        const file = searchParams.get("file");
        const staged = searchParams.get("staged") === "true";

        const diffCommand = staged
          ? file
            ? `diff --cached -- "${file}"`
            : "diff --cached"
          : file
            ? `diff -- "${file}"`
            : "diff";

        const result = await execGit(workspacePath, diffCommand);
        return NextResponse.json({ diff: result.stdout });
      }

      case "branches": {
        const result = await execGit(workspacePath, "branch -a");
        const branches = result.stdout.trim().split("\n").map((line) => {
          const current = line.startsWith("*");
          const name = line.replace(/^\*?\s+/, "").trim();
          const remote = name.startsWith("remotes/");
          return { name: remote ? name.replace("remotes/", "") : name, current, remote };
        });
        return NextResponse.json({ branches });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Git operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Git operation failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace/git
 * Execute git commands (add, commit, push, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, action, ...params } = body;

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace path is required" },
        { status: 400 }
      );
    }

    // Validate workspace exists
    try {
      const workspaceStat = await fs.stat(workspace);
      if (!workspaceStat.isDirectory()) {
        return NextResponse.json(
          { error: "Workspace path is not a directory" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Workspace directory not found" },
        { status: 404 }
      );
    }

    // Check if it's a git repo
    if (!(await isGitRepo(workspace))) {
      return NextResponse.json(
        { error: "Not a git repository" },
        { status: 400 }
      );
    }

    switch (action) {
      case "add": {
        const { files } = params;
        if (!files || !Array.isArray(files) || files.length === 0) {
          return NextResponse.json(
            { error: "Files array is required" },
            { status: 400 }
          );
        }

        // Add each file
        const results = await Promise.all(
          files.map(async (file: string) => {
            try {
              await execGit(workspace, `add "${file}"`);
              return { file, success: true };
            } catch (err) {
              return {
                file,
                success: false,
                error: err instanceof Error ? err.message : "Failed to add",
              };
            }
          })
        );

        return NextResponse.json({
          success: results.every((r) => r.success),
          results,
        });
      }

      case "commit": {
        const { message, files } = params;
        if (!message) {
          return NextResponse.json(
            { error: "Commit message is required" },
            { status: 400 }
          );
        }

        // If files specified, add them first
        if (files && Array.isArray(files) && files.length > 0) {
          for (const file of files) {
            await execGit(workspace, `add "${file}"`);
          }
        }

        // Check if there are staged changes
        const statusResult = await execGit(workspace, "status --porcelain");
        const hasStaged = statusResult.stdout.split("\n").some(
          (line) => line.length > 0 && line[0] !== " " && line[0] !== "?"
        );

        if (!hasStaged) {
          return NextResponse.json(
            { error: "Nothing to commit (no staged changes)" },
            { status: 400 }
          );
        }

        // Escape message for shell
        const escapedMessage = message.replace(/"/g, '\\"');
        const result = await execGit(workspace, `commit -m "${escapedMessage}"`);

        // Get the new commit hash
        const hashResult = await execGit(workspace, "rev-parse HEAD");

        return NextResponse.json({
          success: true,
          hash: hashResult.stdout.trim(),
          message: result.stdout,
        });
      }

      case "push": {
        const { remote = "origin", branch } = params;

        // Get current branch if not specified
        let targetBranch = branch;
        if (!targetBranch) {
          const branchResult = await execGit(workspace, "branch --show-current");
          targetBranch = branchResult.stdout.trim();
        }

        const result = await execGit(workspace, `push ${remote} ${targetBranch}`);

        return NextResponse.json({
          success: true,
          remote,
          branch: targetBranch,
          message: result.stdout || result.stderr,
        });
      }

      case "pull": {
        const { remote = "origin", branch } = params;

        let targetBranch = branch;
        if (!targetBranch) {
          const branchResult = await execGit(workspace, "branch --show-current");
          targetBranch = branchResult.stdout.trim();
        }

        const result = await execGit(workspace, `pull ${remote} ${targetBranch}`);

        return NextResponse.json({
          success: true,
          remote,
          branch: targetBranch,
          message: result.stdout,
        });
      }

      case "checkout": {
        const { branch, create } = params;
        if (!branch) {
          return NextResponse.json(
            { error: "Branch name is required" },
            { status: 400 }
          );
        }

        const command = create ? `checkout -b "${branch}"` : `checkout "${branch}"`;
        const result = await execGit(workspace, command);

        return NextResponse.json({
          success: true,
          branch,
          message: result.stdout || result.stderr,
        });
      }

      case "stash": {
        const { pop, message: stashMessage } = params;

        const command = pop
          ? "stash pop"
          : stashMessage
            ? `stash push -m "${stashMessage.replace(/"/g, '\\"')}"`
            : "stash";

        const result = await execGit(workspace, command);

        return NextResponse.json({
          success: true,
          message: result.stdout || result.stderr,
        });
      }

      case "reset": {
        const { file, hard } = params;

        // Only allow resetting specific files or soft reset
        if (hard && !file) {
          return NextResponse.json(
            { error: "Hard reset without file not allowed" },
            { status: 400 }
          );
        }

        const command = file
          ? `checkout -- "${file}"`
          : "reset HEAD";

        const result = await execGit(workspace, command);

        return NextResponse.json({
          success: true,
          message: result.stdout || result.stderr,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Git operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Git operation failed" },
      { status: 500 }
    );
  }
}
