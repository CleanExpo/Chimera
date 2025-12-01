import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export interface ProjectAnalysis {
  exists: boolean;
  name: string;
  path: string;

  // Structure detection
  hasPackageJson: boolean;
  hasGit: boolean;
  hasTsConfig: boolean;
  hasReadme: boolean;
  hasPyProject: boolean;

  // Detected info
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  framework?: string;
  language?: "typescript" | "javascript" | "python" | "other";

  // Counts
  totalFiles: number;
  sourceFiles: number;

  // Package info
  dependencies: string[];
  devDependencies: string[];

  // Git info
  gitBranch?: string;
  gitRemote?: string;
  hasUncommittedChanges: boolean;

  // Entry points
  entryPoints: string[];

  // README
  readmeSummary?: string;

  // Error
  error?: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function countFiles(
  dir: string,
  extensions: string[] = []
): Promise<{ total: number; matching: number }> {
  let total = 0;
  let matching = 0;

  const ignoreDirs = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv", ".venv"];

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name)) {
            await walk(path.join(currentDir, entry.name));
          }
        } else if (entry.isFile()) {
          total++;
          if (extensions.length === 0) {
            matching++;
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.includes(ext)) {
              matching++;
            }
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  await walk(dir);
  return { total, matching };
}

async function getGitInfo(projectPath: string): Promise<{
  branch?: string;
  remote?: string;
  hasChanges: boolean;
}> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Get current branch
    const { stdout: branchOut } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd: projectPath,
    });
    const branch = branchOut.trim();

    // Get remote URL
    let remote: string | undefined;
    try {
      const { stdout: remoteOut } = await execAsync("git remote get-url origin", {
        cwd: projectPath,
      });
      remote = remoteOut.trim();
    } catch {
      // No remote configured
    }

    // Check for uncommitted changes
    const { stdout: statusOut } = await execAsync("git status --porcelain", {
      cwd: projectPath,
    });
    const hasChanges = statusOut.trim().length > 0;

    return { branch, remote, hasChanges };
  } catch {
    return { hasChanges: false };
  }
}

function detectFramework(packageJson: Record<string, unknown> | null): string | undefined {
  if (!packageJson) return undefined;

  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  if (deps["next"]) return "Next.js";
  if (deps["@angular/core"]) return "Angular";
  if (deps["vue"]) return "Vue";
  if (deps["svelte"]) return "Svelte";
  if (deps["react"] && !deps["next"]) return "React";
  if (deps["express"]) return "Express";
  if (deps["fastify"]) return "Fastify";
  if (deps["nestjs"]) return "NestJS";
  if (deps["electron"]) return "Electron";

  return undefined;
}

function detectPackageManager(projectPath: string, checks: {
  hasLockFile: (name: string) => Promise<boolean>;
}): Promise<"npm" | "pnpm" | "yarn" | "bun" | undefined> {
  return (async () => {
    if (await checks.hasLockFile("pnpm-lock.yaml")) return "pnpm";
    if (await checks.hasLockFile("yarn.lock")) return "yarn";
    if (await checks.hasLockFile("bun.lockb")) return "bun";
    if (await checks.hasLockFile("package-lock.json")) return "npm";
    return undefined;
  })();
}

export async function POST(request: NextRequest) {
  try {
    const { projectPath } = await request.json();

    if (!projectPath || typeof projectPath !== "string") {
      return NextResponse.json(
        { error: "Project path is required" },
        { status: 400 }
      );
    }

    // Normalize path
    const normalizedPath = path.resolve(projectPath);

    // Check if directory exists
    const exists = await fileExists(normalizedPath);
    if (!exists) {
      return NextResponse.json({
        exists: false,
        error: "Directory does not exist",
        path: normalizedPath,
        name: path.basename(normalizedPath),
      } as ProjectAnalysis);
    }

    // Check for key files
    const hasPackageJson = await fileExists(path.join(normalizedPath, "package.json"));
    const hasGit = await fileExists(path.join(normalizedPath, ".git"));
    const hasTsConfig = await fileExists(path.join(normalizedPath, "tsconfig.json"));
    const hasReadme = await fileExists(path.join(normalizedPath, "README.md"));
    const hasPyProject = await fileExists(path.join(normalizedPath, "pyproject.toml"));

    // Read package.json
    const packageJson = hasPackageJson
      ? await readJsonFile(path.join(normalizedPath, "package.json"))
      : null;

    // Detect language
    let language: "typescript" | "javascript" | "python" | "other" = "other";
    if (hasTsConfig) language = "typescript";
    else if (hasPackageJson) language = "javascript";
    else if (hasPyProject) language = "python";

    // Detect framework
    const framework = detectFramework(packageJson);

    // Detect package manager
    const packageManager = await detectPackageManager(normalizedPath, {
      hasLockFile: (name) => fileExists(path.join(normalizedPath, name)),
    });

    // Count files
    const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"];
    const { total: totalFiles, matching: sourceFiles } = await countFiles(
      normalizedPath,
      sourceExtensions
    );

    // Get dependencies
    const dependencies = Object.keys((packageJson?.dependencies as Record<string, string>) || {});
    const devDependencies = Object.keys((packageJson?.devDependencies as Record<string, string>) || {});

    // Get git info
    const gitInfo = hasGit ? await getGitInfo(normalizedPath) : { hasChanges: false };

    // Read README summary
    let readmeSummary: string | undefined;
    if (hasReadme) {
      try {
        const readme = await fs.readFile(path.join(normalizedPath, "README.md"), "utf-8");
        // Get first 500 chars as summary
        readmeSummary = readme.slice(0, 500).trim();
        if (readme.length > 500) readmeSummary += "...";
      } catch {
        // Ignore
      }
    }

    // Detect entry points
    const entryPoints: string[] = [];
    const possibleEntries = [
      "src/index.ts",
      "src/index.tsx",
      "src/main.ts",
      "src/main.tsx",
      "src/app.ts",
      "src/app.tsx",
      "index.ts",
      "index.js",
      "main.py",
      "app.py",
      "src/index.js",
      "pages/index.tsx",
      "app/page.tsx",
    ];

    for (const entry of possibleEntries) {
      if (await fileExists(path.join(normalizedPath, entry))) {
        entryPoints.push(entry);
      }
    }

    const analysis: ProjectAnalysis = {
      exists: true,
      name: (packageJson?.name as string) || path.basename(normalizedPath),
      path: normalizedPath,
      hasPackageJson,
      hasGit,
      hasTsConfig,
      hasReadme,
      hasPyProject,
      packageManager,
      framework,
      language,
      totalFiles,
      sourceFiles,
      dependencies,
      devDependencies,
      gitBranch: gitInfo.branch,
      gitRemote: gitInfo.remote,
      hasUncommittedChanges: gitInfo.hasChanges,
      entryPoints,
      readmeSummary,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Project analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze project" },
      { status: 500 }
    );
  }
}
