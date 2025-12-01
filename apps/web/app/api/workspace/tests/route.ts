/**
 * Test Runner API
 * Run tests in the workspace project and stream results
 *
 * NOTE: This API only works in local development (requires test runner CLI)
 */

import { NextRequest, NextResponse } from "next/server";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import { isVercel, localOnlyFeatureResponse } from "@/lib/utils/environment";

const execAsync = promisify(exec);

interface TestConfig {
  framework: "jest" | "vitest" | "mocha" | "pytest" | "cargo" | "go" | "unknown";
  command: string;
  configFile?: string;
}

/**
 * Detect test framework from project files
 */
async function detectTestFramework(workspacePath: string): Promise<TestConfig> {
  try {
    // Check for package.json (JS/TS projects)
    const packageJsonPath = path.join(workspacePath, "package.json");
    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );

      const devDeps = packageJson.devDependencies || {};
      const deps = packageJson.dependencies || {};
      const scripts = packageJson.scripts || {};

      // Check for Vitest
      if (devDeps.vitest || deps.vitest) {
        return {
          framework: "vitest",
          command: scripts.test?.includes("vitest")
            ? "npm test"
            : "npx vitest run",
          configFile: "vitest.config.ts",
        };
      }

      // Check for Jest
      if (devDeps.jest || deps.jest) {
        return {
          framework: "jest",
          command: scripts.test?.includes("jest")
            ? "npm test"
            : "npx jest",
          configFile: "jest.config.js",
        };
      }

      // Check for Mocha
      if (devDeps.mocha || deps.mocha) {
        return {
          framework: "mocha",
          command: scripts.test?.includes("mocha")
            ? "npm test"
            : "npx mocha",
          configFile: ".mocharc.json",
        };
      }

      // Check if there's a test script
      if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
        return {
          framework: "unknown",
          command: "npm test",
        };
      }
    } catch {
      // package.json not found or invalid, continue checking
    }

    // Check for Python projects
    const pyprojectPath = path.join(workspacePath, "pyproject.toml");
    const requirementsPath = path.join(workspacePath, "requirements.txt");

    try {
      await fs.access(pyprojectPath);
      return {
        framework: "pytest",
        command: "pytest -v",
        configFile: "pyproject.toml",
      };
    } catch {
      try {
        await fs.access(requirementsPath);
        const requirements = await fs.readFile(requirementsPath, "utf-8");
        if (requirements.includes("pytest")) {
          return {
            framework: "pytest",
            command: "pytest -v",
          };
        }
      } catch {
        // Not a Python project
      }
    }

    // Check for Rust projects
    const cargoPath = path.join(workspacePath, "Cargo.toml");
    try {
      await fs.access(cargoPath);
      return {
        framework: "cargo",
        command: "cargo test",
        configFile: "Cargo.toml",
      };
    } catch {
      // Not a Rust project
    }

    // Check for Go projects
    const goModPath = path.join(workspacePath, "go.mod");
    try {
      await fs.access(goModPath);
      return {
        framework: "go",
        command: "go test ./...",
        configFile: "go.mod",
      };
    } catch {
      // Not a Go project
    }

    return {
      framework: "unknown",
      command: "npm test",
    };
  } catch (error) {
    return {
      framework: "unknown",
      command: "npm test",
    };
  }
}

/**
 * Parse test output to extract results
 */
function parseTestOutput(output: string, framework: string): {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration?: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let duration: number | undefined;

  switch (framework) {
    case "vitest":
    case "jest": {
      // Jest/Vitest: Tests:       2 passed, 2 total
      const testsMatch = output.match(/Tests:\s+(\d+)\s+passed,?\s*(\d+)?\s*failed?,?\s*(\d+)?\s*skipped?,?\s*(\d+)\s+total/i);
      if (testsMatch) {
        passed = parseInt(testsMatch[1]) || 0;
        failed = parseInt(testsMatch[2]) || 0;
        skipped = parseInt(testsMatch[3]) || 0;
      }
      // Time: 1.23s
      const timeMatch = output.match(/Time:\s+([\d.]+)\s*s/i);
      if (timeMatch) {
        duration = parseFloat(timeMatch[1]) * 1000;
      }
      break;
    }
    case "pytest": {
      // pytest: 2 passed, 1 failed in 0.12s
      const pytestMatch = output.match(/(\d+)\s+passed(?:,\s*(\d+)\s+failed)?(?:,\s*(\d+)\s+skipped)?.*?in\s+([\d.]+)s/i);
      if (pytestMatch) {
        passed = parseInt(pytestMatch[1]) || 0;
        failed = parseInt(pytestMatch[2]) || 0;
        skipped = parseInt(pytestMatch[3]) || 0;
        duration = parseFloat(pytestMatch[4]) * 1000;
      }
      break;
    }
    case "cargo": {
      // cargo: test result: ok. 2 passed; 0 failed; 0 ignored
      const cargoMatch = output.match(/test result:.*?(\d+)\s+passed;\s*(\d+)\s+failed;\s*(\d+)\s+ignored/i);
      if (cargoMatch) {
        passed = parseInt(cargoMatch[1]) || 0;
        failed = parseInt(cargoMatch[2]) || 0;
        skipped = parseInt(cargoMatch[3]) || 0;
      }
      break;
    }
    case "go": {
      // Count PASS/FAIL lines
      const passMatches = output.match(/--- PASS:/g);
      const failMatches = output.match(/--- FAIL:/g);
      passed = passMatches?.length || 0;
      failed = failMatches?.length || 0;
      break;
    }
    default: {
      // Generic fallback: count common patterns
      const passMatches = output.match(/\bpass(ed|ing)?\b/gi);
      const failMatches = output.match(/\bfail(ed|ing)?\b/gi);
      passed = passMatches?.length || 0;
      failed = failMatches?.length || 0;
    }
  }

  return {
    passed,
    failed,
    skipped,
    total: passed + failed + skipped,
    duration,
  };
}

/**
 * GET /api/workspace/tests
 * Get test configuration and available test files
 */
export async function GET(request: NextRequest) {
  // Block on Vercel/production - requires test runner CLI
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceParam = searchParams.get("workspace");

  if (!workspaceParam) {
    return NextResponse.json(
      { error: "Workspace path is required" },
      { status: 400 }
    );
  }

  const workspace = workspaceParam; // Now TypeScript knows this is string, not string | null

  try {
    // Validate workspace exists
    const stat = await fs.stat(workspace);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: "Workspace path is not a directory" },
        { status: 400 }
      );
    }

    // Detect test framework
    const config = await detectTestFramework(workspace);

    // Find test files
    const testPatterns = [
      "**/*.test.{js,ts,jsx,tsx}",
      "**/*.spec.{js,ts,jsx,tsx}",
      "**/test_*.py",
      "**/*_test.py",
      "**/tests/**/*.py",
      "**/src/**/*_test.rs",
      "**/*_test.go",
    ];

    // Use a simple glob-like search
    const testFiles: string[] = [];

    async function findTestFiles(dir: string, depth: number = 0): Promise<void> {
      if (depth > 5) return; // Limit depth

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(workspace, fullPath);

          // Skip node_modules, .git, etc.
          if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") {
            continue;
          }

          if (entry.isDirectory()) {
            await findTestFiles(fullPath, depth + 1);
          } else if (entry.isFile()) {
            // Check if it's a test file
            if (
              entry.name.match(/\.(test|spec)\.(js|ts|jsx|tsx)$/) ||
              entry.name.match(/^test_.*\.py$/) ||
              entry.name.match(/.*_test\.py$/) ||
              entry.name.match(/.*_test\.rs$/) ||
              entry.name.match(/.*_test\.go$/)
            ) {
              testFiles.push(relativePath);
            }
          }
        }
      } catch {
        // Ignore errors reading directories
      }
    }

    await findTestFiles(workspace);

    return NextResponse.json({
      framework: config.framework,
      command: config.command,
      configFile: config.configFile,
      testFiles: testFiles.slice(0, 100), // Limit to 100 files
      testFileCount: testFiles.length,
    });
  } catch (error) {
    console.error("Test config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get test config" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace/tests
 * Run tests in the workspace
 */
export async function POST(request: NextRequest) {
  // Block on Vercel/production - requires test runner CLI
  if (isVercel()) {
    return NextResponse.json(localOnlyFeatureResponse(), { status: 501 });
  }

  try {
    const body = await request.json();
    const { workspace, testFile, testName, watch, coverage, customCommand } = body;

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

    // Detect or use custom command
    let command: string;
    let framework: string;

    if (customCommand) {
      command = customCommand;
      framework = "custom";
    } else {
      const config = await detectTestFramework(workspace);
      command = config.command;
      framework = config.framework;

      // Add options based on framework
      if (testFile) {
        switch (framework) {
          case "jest":
          case "vitest":
            command += ` ${testFile}`;
            if (testName) {
              command += ` -t "${testName}"`;
            }
            break;
          case "pytest":
            command += ` ${testFile}`;
            if (testName) {
              command += ` -k "${testName}"`;
            }
            break;
          case "cargo":
            if (testName) {
              command += ` ${testName}`;
            }
            break;
          case "go":
            command += ` -run "${testName || "."}"`;
            break;
        }
      }

      if (watch && (framework === "jest" || framework === "vitest")) {
        command = command.replace(" run", "");
        command += " --watch";
      }

      if (coverage) {
        switch (framework) {
          case "jest":
            command += " --coverage";
            break;
          case "vitest":
            command += " --coverage";
            break;
          case "pytest":
            command += " --cov";
            break;
        }
      }
    }

    // Run tests
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workspace,
        timeout: 300000, // 5 minute timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: {
          ...process.env,
          CI: "true", // Many test runners behave differently in CI mode
          FORCE_COLOR: "0", // Disable color codes for easier parsing
        },
      });

      const duration = Date.now() - startTime;
      const output = stdout + stderr;
      const results = parseTestOutput(output, framework);

      return NextResponse.json({
        success: results.failed === 0,
        framework,
        command,
        output,
        results: {
          ...results,
          duration: results.duration || duration,
        },
        exitCode: 0,
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const execError = error as { stdout?: string; stderr?: string; code?: number };
      const output = (execError.stdout || "") + (execError.stderr || "");
      const results = parseTestOutput(output, framework);

      return NextResponse.json({
        success: false,
        framework,
        command,
        output,
        results: {
          ...results,
          duration: results.duration || duration,
        },
        exitCode: execError.code || 1,
        error: error instanceof Error ? error.message : "Tests failed",
      });
    }
  } catch (error) {
    console.error("Test runner error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test runner failed" },
      { status: 500 }
    );
  }
}
