/**
 * Workspace File Operations API
 * Provides read/write/list operations scoped to the active workspace project
 *
 * NOTE: This API only works in local development (requires filesystem access)
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isVercel, localOnlyFeatureResponse } from "@/lib/utils/environment";

// Security: Validate path is within the workspace
function isPathWithinWorkspace(filePath: string, workspacePath: string): boolean {
  const normalizedFile = path.normalize(path.resolve(workspacePath, filePath));
  const normalizedWorkspace = path.normalize(path.resolve(workspacePath));
  return normalizedFile.startsWith(normalizedWorkspace);
}

// Security: Block sensitive files
const BLOCKED_PATTERNS = [
  /\.env/i,
  /\.git\/config/i,
  /credentials/i,
  /secrets/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /\.ssh\//i,
];

function isSensitivePath(filePath: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * GET /api/workspace/files
 * List files in a directory or read a file
 */
export async function GET(request: NextRequest) {
  // Block on Vercel/production - requires local filesystem
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const workspacePath = searchParams.get("workspace");
    const filePath = searchParams.get("path") || ".";
    const action = searchParams.get("action") || "list"; // list | read

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

    // Security check
    if (!isPathWithinWorkspace(filePath, workspacePath)) {
      return NextResponse.json(
        { error: "Path is outside workspace" },
        { status: 403 }
      );
    }

    const fullPath = path.join(workspacePath, filePath);

    if (action === "read") {
      // Check for sensitive files
      if (isSensitivePath(filePath)) {
        return NextResponse.json(
          { error: "Cannot read sensitive files" },
          { status: 403 }
        );
      }

      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          return NextResponse.json(
            { error: "Path is a directory, use action=list" },
            { status: 400 }
          );
        }

        // Limit file size (10MB max)
        if (stat.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "File too large (max 10MB)" },
            { status: 400 }
          );
        }

        const content = await fs.readFile(fullPath, "utf-8");
        return NextResponse.json({
          path: filePath,
          content,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      } catch {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    } else {
      // List directory
      try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        const files = await Promise.all(
          entries
            .filter((entry) => !entry.name.startsWith(".") || entry.name === ".env.example")
            .map(async (entry) => {
              const entryPath = path.join(fullPath, entry.name);
              try {
                const stat = await fs.stat(entryPath);
                return {
                  name: entry.name,
                  path: path.join(filePath, entry.name).replace(/\\/g, "/"),
                  type: entry.isDirectory() ? "directory" : "file",
                  size: entry.isFile() ? stat.size : undefined,
                  modified: stat.mtime.toISOString(),
                };
              } catch {
                return {
                  name: entry.name,
                  path: path.join(filePath, entry.name).replace(/\\/g, "/"),
                  type: entry.isDirectory() ? "directory" : "file",
                };
              }
            })
        );

        // Sort: directories first, then alphabetically
        files.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        return NextResponse.json({
          path: filePath,
          files,
        });
      } catch {
        return NextResponse.json(
          { error: "Directory not found" },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace/files
 * Write content to a file
 */
export async function POST(request: NextRequest) {
  // Block on Vercel/production - requires local filesystem
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const body = await request.json();
    const { workspace, path: filePath, content, createDirs } = body;

    if (!workspace || !filePath) {
      return NextResponse.json(
        { error: "Workspace and path are required" },
        { status: 400 }
      );
    }

    if (content === undefined) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // Security checks
    if (!isPathWithinWorkspace(filePath, workspace)) {
      return NextResponse.json(
        { error: "Path is outside workspace" },
        { status: 403 }
      );
    }

    if (isSensitivePath(filePath)) {
      return NextResponse.json(
        { error: "Cannot write to sensitive files" },
        { status: 403 }
      );
    }

    const fullPath = path.join(workspace, filePath);

    // Create parent directories if requested
    if (createDirs) {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
    }

    // Write the file
    await fs.writeFile(fullPath, content, "utf-8");

    const stat = await fs.stat(fullPath);

    return NextResponse.json({
      success: true,
      path: filePath,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error("File write error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to write file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/files
 * Delete a file
 */
export async function DELETE(request: NextRequest) {
  // Block on Vercel/production - requires local filesystem
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const workspace = searchParams.get("workspace");
    const filePath = searchParams.get("path");

    if (!workspace || !filePath) {
      return NextResponse.json(
        { error: "Workspace and path are required" },
        { status: 400 }
      );
    }

    // Security checks
    if (!isPathWithinWorkspace(filePath, workspace)) {
      return NextResponse.json(
        { error: "Path is outside workspace" },
        { status: 403 }
      );
    }

    if (isSensitivePath(filePath)) {
      return NextResponse.json(
        { error: "Cannot delete sensitive files" },
        { status: 403 }
      );
    }

    const fullPath = path.join(workspace, filePath);

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        return NextResponse.json(
          { error: "Cannot delete directories through this API" },
          { status: 400 }
        );
      }
      await fs.unlink(fullPath);
      return NextResponse.json({
        success: true,
        path: filePath,
      });
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
