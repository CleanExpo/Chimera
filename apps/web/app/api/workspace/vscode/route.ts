/**
 * VS Code Integration API
 * Provides commands to open files/folders in VS Code
 *
 * NOTE: This API only works in local development (requires VS Code CLI)
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import { isVercel, localOnlyFeatureResponse } from "@/lib/utils/environment";

const execAsync = promisify(exec);

// Detect the VS Code command based on platform
async function getVSCodeCommand(): Promise<string | null> {
  const commands = ["code", "code-insiders"];

  for (const cmd of commands) {
    try {
      // Check if command exists
      const checkCmd = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
      await execAsync(checkCmd);
      return cmd;
    } catch {
      // Command not found, try next
    }
  }

  return null;
}

/**
 * POST /api/workspace/vscode
 * Execute VS Code commands
 */
export async function POST(request: NextRequest) {
  // Block on Vercel/production - requires VS Code CLI
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const body = await request.json();
    const { action, workspace, file, line, column, diff, reuse } = body;

    // Get VS Code command
    const vsCodeCmd = await getVSCodeCommand();
    if (!vsCodeCmd) {
      return NextResponse.json(
        { error: "VS Code is not installed or not in PATH" },
        { status: 400 }
      );
    }

    switch (action) {
      case "open-workspace": {
        // Open a workspace/folder in VS Code
        if (!workspace) {
          return NextResponse.json(
            { error: "Workspace path is required" },
            { status: 400 }
          );
        }

        // Validate workspace exists
        try {
          const stat = await fs.stat(workspace);
          if (!stat.isDirectory()) {
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

        // Build command
        const args = [reuse ? "-r" : "-n", `"${workspace}"`];
        const cmd = `${vsCodeCmd} ${args.join(" ")}`;

        await execAsync(cmd);

        return NextResponse.json({
          success: true,
          message: `Opened ${workspace} in VS Code`,
        });
      }

      case "open-file": {
        // Open a specific file in VS Code
        if (!file) {
          return NextResponse.json(
            { error: "File path is required" },
            { status: 400 }
          );
        }

        // Build full path if workspace provided
        const fullPath = workspace ? path.join(workspace, file) : file;

        // Validate file exists
        try {
          const stat = await fs.stat(fullPath);
          if (!stat.isFile()) {
            return NextResponse.json(
              { error: "Path is not a file" },
              { status: 400 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        // Build command with optional line/column
        let fileArg = `"${fullPath}"`;
        if (line !== undefined) {
          fileArg = `-g "${fullPath}:${line}${column !== undefined ? `:${column}` : ""}"`;
        }

        const args = [reuse ? "-r" : "", fileArg].filter(Boolean);
        const cmd = `${vsCodeCmd} ${args.join(" ")}`;

        await execAsync(cmd);

        return NextResponse.json({
          success: true,
          message: `Opened ${file} in VS Code`,
        });
      }

      case "diff": {
        // Open diff view between two files
        if (!diff || !diff.left || !diff.right) {
          return NextResponse.json(
            { error: "Both left and right file paths are required for diff" },
            { status: 400 }
          );
        }

        const leftPath = workspace ? path.join(workspace, diff.left) : diff.left;
        const rightPath = workspace ? path.join(workspace, diff.right) : diff.right;

        // Validate both files exist
        for (const p of [leftPath, rightPath]) {
          try {
            const stat = await fs.stat(p);
            if (!stat.isFile()) {
              return NextResponse.json(
                { error: `${p} is not a file` },
                { status: 400 }
              );
            }
          } catch {
            return NextResponse.json(
              { error: `File not found: ${p}` },
              { status: 404 }
            );
          }
        }

        const cmd = `${vsCodeCmd} --diff "${leftPath}" "${rightPath}"`;
        await execAsync(cmd);

        return NextResponse.json({
          success: true,
          message: "Opened diff view in VS Code",
        });
      }

      case "new-file": {
        // Create and open a new file
        if (!file) {
          return NextResponse.json(
            { error: "File path is required" },
            { status: 400 }
          );
        }

        const fullPath = workspace ? path.join(workspace, file) : file;

        // Create parent directories if needed
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Create empty file if it doesn't exist
        try {
          await fs.access(fullPath);
        } catch {
          await fs.writeFile(fullPath, "", "utf-8");
        }

        const cmd = `${vsCodeCmd} ${reuse ? "-r" : ""} "${fullPath}"`;
        await execAsync(cmd);

        return NextResponse.json({
          success: true,
          message: `Created and opened ${file} in VS Code`,
        });
      }

      case "check": {
        // Just check if VS Code is available
        return NextResponse.json({
          success: true,
          command: vsCodeCmd,
          message: "VS Code is available",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("VS Code operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "VS Code operation failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/vscode
 * Check VS Code availability
 */
export async function GET() {
  // Block on Vercel/production - requires VS Code CLI
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const vsCodeCmd = await getVSCodeCommand();

    if (!vsCodeCmd) {
      return NextResponse.json({
        available: false,
        message: "VS Code is not installed or not in PATH",
      });
    }

    // Get VS Code version
    try {
      const { stdout } = await execAsync(`${vsCodeCmd} --version`);
      const version = stdout.trim().split("\n")[0];

      return NextResponse.json({
        available: true,
        command: vsCodeCmd,
        version,
      });
    } catch {
      return NextResponse.json({
        available: true,
        command: vsCodeCmd,
        version: "unknown",
      });
    }
  } catch (error) {
    console.error("VS Code check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check VS Code" },
      { status: 500 }
    );
  }
}
