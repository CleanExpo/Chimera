"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BriefingRoom } from "./BriefingRoom";
import { TeamChannel, TeamType, ChannelStatus } from "./TeamChannel";
import { DecisionDesk } from "./DecisionDesk";
import { OrchestratorStatus, OrchestratorState } from "./OrchestratorStatus";
import {
  submitBrief,
  getJobStatus,
  type OrchestrationResponse,
  type TeamOutput,
} from "@/lib/api/orchestrate";
import { useOrchestrationSocket, type WSMessage } from "@/hooks/useOrchestrationSocket";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface ThoughtItem {
  id: string;
  text: string;
  timestamp: Date;
}

interface TeamState {
  status: ChannelStatus;
  thoughts: ThoughtItem[];
  generatedCode?: string;
}

interface CommandCenterState {
  orchestratorState: OrchestratorState;
  activeTeams: string[];
  elapsedTime: number;
  tokenCount: number;
  estimatedCost: number;
  currentTask?: string;
  currentJobId?: string;
  framework: "react" | "vanilla" | "vue" | "svelte";
  anthropic: TeamState;
  google: TeamState;
  error?: string;
}

const initialTeamState: TeamState = {
  status: "idle",
  thoughts: [],
  generatedCode: undefined,
};

const initialState: CommandCenterState = {
  orchestratorState: "idle",
  activeTeams: [],
  elapsedTime: 0,
  tokenCount: 0,
  estimatedCost: 0,
  framework: "react",
  anthropic: { ...initialTeamState },
  google: { ...initialTeamState },
};

export function CommandCenter() {
  const [state, setState] = useState<CommandCenterState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [useWebSocket, setUseWebSocket] = useState(true); // Feature flag for WebSocket
  const { user, loading: authLoading, signOut } = useAuth();

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log("[CommandCenter] WebSocket message:", message);

    // Update elapsed time
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

    setState((prev) => {
      const newState = { ...prev, elapsedTime: elapsed };

      switch (message.type) {
        case "connected":
          console.log("[CommandCenter] WebSocket connected to job", message.job_id);
          break;

        case "status_change":
          if (message.team && (message.team === "anthropic" || message.team === "google")) {
            const mappedStatus = mapTeamStatus(message.data.status);
            newState[message.team] = {
              ...newState[message.team],
              status: mappedStatus,
            };
          }
          break;

        case "thought_added":
          if (message.team && (message.team === "anthropic" || message.team === "google")) {
            const thought: ThoughtItem = {
              id: message.data.id,
              text: message.data.text,
              timestamp: new Date(message.data.timestamp),
            };
            newState[message.team] = {
              ...newState[message.team],
              thoughts: [...newState[message.team].thoughts, thought],
            };
          }
          break;

        case "code_generated":
          if (message.team && (message.team === "anthropic" || message.team === "google")) {
            newState[message.team] = {
              ...newState[message.team],
              generatedCode: message.data.code,
            };
            newState.tokenCount = (newState.tokenCount || 0) + (message.data.token_count || 0);
            newState.estimatedCost = (newState.tokenCount / 1000000) * 3;
          }
          break;

        case "error":
          if (message.team) {
            newState.error = `${message.team}: ${message.data.error}`;
          } else {
            newState.error = message.data.error || "Unknown error";
          }
          setIsProcessing(false);
          break;

        default:
          break;
      }

      return newState;
    });
  }, []);

  // WebSocket connection
  const { isConnected: wsConnected, disconnect: wsDisconnect } = useOrchestrationSocket(
    useWebSocket ? state.currentJobId : undefined,
    {
      onMessage: handleWebSocketMessage,
      onConnect: () => {
        console.log("[CommandCenter] WebSocket connected");
      },
      onDisconnect: () => {
        console.log("[CommandCenter] WebSocket disconnected, falling back to polling");
        // Fall back to polling if WebSocket disconnects
        if (state.currentJobId && isProcessing) {
          pollingIntervalRef.current = setInterval(() => {
            pollJobStatus(state.currentJobId!);
          }, 2000); // Poll every 2 seconds as fallback
        }
      },
      onError: (error) => {
        console.error("[CommandCenter] WebSocket error:", error);
      },
    }
  );

  // Convert backend TeamStatus to frontend ChannelStatus
  const mapTeamStatus = (
    backendStatus: TeamOutput["status"]
  ): ChannelStatus => {
    switch (backendStatus) {
      case "pending":
        return "idle";
      case "thinking":
        return "thinking";
      case "generating":
        return "generating";
      case "complete":
        return "complete";
      case "error":
        return "idle"; // Handle error state gracefully
      default:
        return "idle";
    }
  };

  // Convert backend OrchestrationStatus to frontend OrchestratorState
  const mapOrchestratorStatus = (
    backendStatus: OrchestrationResponse["status"]
  ): OrchestratorState => {
    switch (backendStatus) {
      case "received":
        return "receiving_brief";
      case "planning":
        return "planning";
      case "dispatching":
        return "dispatching";
      case "awaiting":
        return "awaiting_agents";
      case "complete":
        return "complete";
      case "error":
        return "idle";
      default:
        return "idle";
    }
  };

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await getJobStatus(jobId);

      // Update elapsed time
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Update state with backend response
      setState((prev) => {
        const newState: CommandCenterState = {
          ...prev,
          orchestratorState: mapOrchestratorStatus(
            status.status as OrchestrationResponse["status"]
          ),
          elapsedTime: elapsed,
        };

        // Update team states
        Object.entries(status.teams).forEach(([teamName, teamData]) => {
          if (teamName === "anthropic" || teamName === "google") {
            const mappedStatus = mapTeamStatus(teamData.status);

            newState[teamName] = {
              status: mappedStatus,
              thoughts: teamData.thoughts.map((t) => ({
                id: t.id,
                text: t.text,
                timestamp: new Date(t.timestamp),
              })),
              generatedCode: teamData.generated_code,
            };

            // Update token count and cost
            newState.tokenCount =
              (newState.tokenCount || 0) + teamData.token_count;
          }
        });

        // Calculate estimated cost (rough estimate: $3 per 1M tokens)
        newState.estimatedCost = (newState.tokenCount / 1000000) * 3;

        return newState;
      });

      // Stop polling if complete or error
      if (status.status === "complete" || status.status === "error") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error polling job status:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));

      // Stop polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsProcessing(false);
    }
  }, []);

  const handleSubmitBrief = async (brief: string, framework: "react" | "vanilla" | "vue" | "svelte" = "react") => {
    setIsProcessing(true);
    startTimeRef.current = Date.now();

    // Reset state
    setState({
      ...initialState,
      orchestratorState: "receiving_brief",
      currentTask: brief.slice(0, 100) + (brief.length > 100 ? "..." : ""),
      framework,
    });

    try {
      // Submit brief to backend
      const response = await submitBrief({
        brief,
        target_framework: framework,
        include_teams: ["anthropic", "google"],
      });

      // Store job ID
      setState((prev) => ({
        ...prev,
        currentJobId: response.job_id,
        orchestratorState: mapOrchestratorStatus(response.status),
        activeTeams: Object.keys(response.teams).map(
          (t) => t.charAt(0).toUpperCase() + t.slice(1)
        ),
      }));

      // If WebSocket is disabled, use polling
      if (!useWebSocket) {
        // Start polling for status updates
        pollingIntervalRef.current = setInterval(() => {
          pollJobStatus(response.job_id);
        }, 1000); // Poll every second

        // Initial status check
        await pollJobStatus(response.job_id);
      } else {
        // WebSocket will handle updates automatically
        console.log("[CommandCenter] Using WebSocket for real-time updates");
      }
    } catch (error) {
      console.error("Error submitting brief:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to submit brief",
        orchestratorState: "idle",
      }));
      setIsProcessing(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleApprove = (team: TeamType) => {
    console.log(`Approved ${team} output`);
    // TODO: Implement approval flow - send to VS Code bridge
  };

  const handleReject = () => {
    // Stop polling if active
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Disconnect WebSocket if active
    if (useWebSocket && wsDisconnect) {
      wsDisconnect();
    }

    setState(initialState);
    setIsProcessing(false);
  };

  const handleRetry = () => {
    // Stop polling if active
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Retry with the same brief and framework
    if (state.currentTask) {
      handleSubmitBrief(state.currentTask, state.framework);
    } else {
      setState(initialState);
      setIsProcessing(false);
    }
  };

  const handleExport = (team: TeamType) => {
    const code = state[team].generatedCode;
    if (code) {
      const blob = new Blob([code], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${team}-output.jsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digital Command Center</h1>
          <p className="text-muted-foreground">
            Autonomous AI Development Environment
          </p>
        </div>
        <div className="flex items-center gap-2">
          {authLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <UserMenu user={user} onSignOut={signOut} />
          ) : null}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 text-sm font-medium">Error: {state.error}</p>
        </div>
      )}

      {/* Orchestrator Status */}
      <OrchestratorStatus
        state={state.orchestratorState}
        activeTeams={state.activeTeams}
        elapsedTime={state.elapsedTime}
        tokenCount={state.tokenCount}
        estimatedCost={state.estimatedCost}
        currentTask={state.currentTask}
      />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Briefing Room */}
        <div className="lg:col-span-1">
          <BriefingRoom onSubmit={handleSubmitBrief} isLoading={isProcessing} />
        </div>

        {/* Team Channels */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamChannel
            team="anthropic"
            status={state.anthropic.status}
            thoughts={state.anthropic.thoughts}
            generatedCode={state.anthropic.generatedCode}
            modelName="Claude Sonnet 4.5"
            framework={state.framework}
          />
          <TeamChannel
            team="google"
            status={state.google.status}
            thoughts={state.google.thoughts}
            generatedCode={state.google.generatedCode}
            modelName="Gemini 2.0 Flash"
            framework={state.framework}
          />
        </div>
      </div>

      {/* Decision Desk */}
      <DecisionDesk
        hasAnthropicOutput={!!state.anthropic.generatedCode}
        hasGoogleOutput={!!state.google.generatedCode}
        onApprove={handleApprove}
        onReject={handleReject}
        onRetry={handleRetry}
        onExport={handleExport}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default CommandCenter;
