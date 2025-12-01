"use client";

import { useEffect, useState } from "react";
import { useTestRunner, type TestRun, type TestFramework } from "@/hooks/useTestRunner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  Terminal,
  History,
  Settings2,
  Loader2,
  AlertCircle,
  TrendingUp,
  SkipForward,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Framework display configuration
 */
const frameworkConfig: Record<TestFramework, { label: string; color: string }> = {
  jest: { label: "Jest", color: "text-red-500" },
  vitest: { label: "Vitest", color: "text-green-500" },
  mocha: { label: "Mocha", color: "text-yellow-600" },
  pytest: { label: "pytest", color: "text-blue-500" },
  cargo: { label: "Cargo", color: "text-orange-500" },
  go: { label: "Go Test", color: "text-cyan-500" },
  unknown: { label: "Unknown", color: "text-gray-500" },
  custom: { label: "Custom", color: "text-purple-500" },
};

/**
 * Test Runner Component
 */
export function TestRunner() {
  const {
    config,
    currentRun,
    runHistory,
    isRunning,
    isLoadingConfig,
    error,
    loadConfig,
    runTests,
    clearHistory,
    passRate,
  } = useTestRunner();

  const [testFile, setTestFile] = useState("");
  const [testName, setTestName] = useState("");
  const [coverage, setCoverage] = useState(false);
  const [customCommand, setCustomCommand] = useState("");
  const [useCustomCommand, setUseCustomCommand] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleRunTests = async () => {
    await runTests({
      testFile: testFile || undefined,
      testName: testName || undefined,
      coverage,
      customCommand: useCustomCommand ? customCommand : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Test Runner
          </h2>
          <p className="text-sm text-muted-foreground">
            Run and monitor tests in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <Badge variant="outline" className={frameworkConfig[config.framework].color}>
              {frameworkConfig[config.framework].label}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={loadConfig}
            disabled={isLoadingConfig}
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingConfig && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<FileCode className="h-5 w-5" />}
          label="Test Files"
          value={config?.testFileCount ?? 0}
          subLabel="Detected"
        />
        <StatsCard
          icon={<History className="h-5 w-5" />}
          label="Runs"
          value={runHistory.length}
          subLabel="This session"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pass Rate"
          value={`${Math.round(passRate * 100)}%`}
          subLabel="Success rate"
          highlight={passRate >= 0.8}
        />
        <StatsCard
          icon={currentRun?.success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          label="Last Run"
          value={currentRun ? (currentRun.success ? "Passed" : "Failed") : "N/A"}
          subLabel={currentRun?.results.duration ? `${Math.round(currentRun.results.duration / 1000)}s` : ""}
          highlight={currentRun?.success}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Run Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>Configure and run tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test File */}
            <div className="space-y-2">
              <Label htmlFor="testFile">Test File (optional)</Label>
              <Input
                id="testFile"
                placeholder="e.g., src/utils.test.ts"
                value={testFile}
                onChange={(e) => setTestFile(e.target.value)}
                disabled={isRunning}
              />
            </div>

            {/* Test Name */}
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name (optional)</Label>
              <Input
                id="testName"
                placeholder="e.g., should calculate sum"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                disabled={isRunning}
              />
            </div>

            {/* Coverage Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Coverage Report</Label>
                <p className="text-xs text-muted-foreground">Generate coverage</p>
              </div>
              <Switch
                checked={coverage}
                onCheckedChange={setCoverage}
                disabled={isRunning}
              />
            </div>

            {/* Custom Command Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Custom Command</Label>
                <p className="text-xs text-muted-foreground">Override default</p>
              </div>
              <Switch
                checked={useCustomCommand}
                onCheckedChange={setUseCustomCommand}
                disabled={isRunning}
              />
            </div>

            {/* Custom Command Input */}
            {useCustomCommand && (
              <div className="space-y-2">
                <Label htmlFor="customCommand">Command</Label>
                <Input
                  id="customCommand"
                  placeholder="npm test -- --verbose"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            )}

            {/* Run Button */}
            <Button
              className="w-full"
              onClick={handleRunTests}
              disabled={isRunning || isLoadingConfig}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>

            {/* Detected Command */}
            {config && !useCustomCommand && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <span className="font-medium">Command: </span>
                <code>{config.command}</code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="output" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="output" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                  {runHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {runHistory.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <FileCode className="h-4 w-4" />
                  Test Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="output">
                {currentRun ? (
                  <div className="space-y-4">
                    {/* Results Summary */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          currentRun.success
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        )}
                      >
                        {currentRun.success ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <XCircle className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {currentRun.success ? "Tests Passed" : "Tests Failed"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="text-green-500">
                            {currentRun.results.passed} passed
                          </span>
                          {currentRun.results.failed > 0 && (
                            <span className="text-red-500">
                              {currentRun.results.failed} failed
                            </span>
                          )}
                          {currentRun.results.skipped > 0 && (
                            <span className="text-yellow-500">
                              {currentRun.results.skipped} skipped
                            </span>
                          )}
                          {currentRun.results.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {(currentRun.results.duration / 1000).toFixed(2)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Output */}
                    <ScrollArea className="h-[300px] rounded-lg border bg-black/90 p-4">
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {currentRun.output || "No output"}
                      </pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No test run yet</p>
                    <p className="text-sm">Run tests to see results</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {runHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No test history</p>
                    <p className="text-sm">Run tests to build history</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-2">
                        {runHistory.map((run) => (
                          <RunHistoryItem key={run.id} run={run} />
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </TabsContent>

              <TabsContent value="files">
                {!config?.testFiles || config.testFiles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No test files detected</p>
                    <p className="text-sm">Add test files to your project</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-1">
                      {config.testFiles.map((file) => (
                        <button
                          key={file}
                          className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-left text-sm"
                          onClick={() => setTestFile(file)}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono truncate">{file}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Stats card component
 */
function StatsCard({
  icon,
  label,
  value,
  subLabel,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subLabel: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-green-500/50 bg-green-500/5")}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            highlight ? "bg-green-500/20 text-green-500" : "bg-primary/10 text-primary"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Run history item component
 */
function RunHistoryItem({ run }: { run: TestRun }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        run.success
          ? "border-green-500/20 bg-green-500/5"
          : "border-red-500/20 bg-red-500/5"
      )}
    >
      <div className={run.success ? "text-green-500" : "text-red-500"}>
        {run.success ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {run.testFile || "All tests"}
          </span>
          <Badge variant="outline" className="text-xs">
            {frameworkConfig[run.framework].label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-green-500">{run.results.passed} passed</span>
          {run.results.failed > 0 && (
            <span className="text-red-500">{run.results.failed} failed</span>
          )}
          {run.results.skipped > 0 && (
            <span className="text-yellow-500">
              <SkipForward className="h-3 w-3 inline mr-1" />
              {run.results.skipped}
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        <div>{new Date(run.timestamp).toLocaleTimeString()}</div>
        {run.results.duration && (
          <div className="flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            {(run.results.duration / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  );
}

export default TestRunner;
