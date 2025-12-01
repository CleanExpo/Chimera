"use client";

import { useState, useCallback } from "react";
import { BriefingRoom } from "./BriefingRoom";
import { TeamChannel, TeamType, ChannelStatus } from "./TeamChannel";
import { DecisionDesk } from "./DecisionDesk";
import { OrchestratorStatus, OrchestratorState } from "./OrchestratorStatus";

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
  anthropic: TeamState;
  google: TeamState;
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
  anthropic: { ...initialTeamState },
  google: { ...initialTeamState },
};

export function CommandCenter() {
  const [state, setState] = useState<CommandCenterState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  const addThought = useCallback((team: TeamType, text: string) => {
    setState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        thoughts: [
          ...prev[team].thoughts,
          { id: crypto.randomUUID(), text, timestamp: new Date() },
        ],
      },
    }));
  }, []);

  const handleSubmitBrief = async (brief: string) => {
    setIsProcessing(true);

    // Reset state
    setState({
      ...initialState,
      orchestratorState: "receiving_brief",
      currentTask: brief.slice(0, 100) + (brief.length > 100 ? "..." : ""),
    });

    // Simulate orchestrator flow
    await simulateOrchestration(brief);
  };

  const simulateOrchestration = async (brief: string) => {
    // Phase 1: Planning
    setState((prev) => ({
      ...prev,
      orchestratorState: "planning",
      elapsedTime: 1,
    }));
    await delay(1500);

    // Phase 2: Dispatching
    setState((prev) => ({
      ...prev,
      orchestratorState: "dispatching",
      activeTeams: ["Anthropic", "Google"],
      elapsedTime: 3,
    }));
    await delay(1000);

    // Phase 3: Agents working
    setState((prev) => ({
      ...prev,
      orchestratorState: "awaiting_agents",
      anthropic: { ...prev.anthropic, status: "thinking" },
      google: { ...prev.google, status: "thinking" },
    }));

    // Simulate thought streams
    addThought("anthropic", "Analyzing requirements...");
    addThought("google", "Processing brief...");
    await delay(1000);

    addThought("anthropic", "Identifying component structure...");
    addThought("google", "Selecting optimal patterns...");
    await delay(1000);

    setState((prev) => ({
      ...prev,
      anthropic: { ...prev.anthropic, status: "generating" },
      google: { ...prev.google, status: "generating" },
      tokenCount: 1250,
      estimatedCost: 0.0038,
    }));

    addThought("anthropic", "Generating React component...");
    addThought("google", "Building component structure...");
    await delay(2000);

    // Phase 4: Complete with generated code
    const sampleCode = generateSampleCode(brief);

    setState((prev) => ({
      ...prev,
      orchestratorState: "complete",
      elapsedTime: 8,
      tokenCount: 2450,
      estimatedCost: 0.0074,
      anthropic: {
        ...prev.anthropic,
        status: "complete",
        generatedCode: sampleCode.anthropic,
      },
      google: {
        ...prev.google,
        status: "complete",
        generatedCode: sampleCode.google,
      },
    }));

    addThought("anthropic", "Generation complete!");
    addThought("google", "Code ready for review!");

    setIsProcessing(false);
  };

  const handleApprove = (team: TeamType) => {
    console.log(`Approved ${team} output`);
    // TODO: Implement approval flow - send to VS Code bridge
  };

  const handleReject = () => {
    setState(initialState);
    setIsProcessing(false);
  };

  const handleRetry = () => {
    setState(initialState);
    setIsProcessing(false);
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
      </div>

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
          />
          <TeamChannel
            team="google"
            status={state.google.status}
            thoughts={state.google.thoughts}
            generatedCode={state.google.generatedCode}
            modelName="Gemini 2.0 Flash"
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

// Helper functions
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSampleCode(brief: string) {
  // Sample generated code for demo purposes
  const anthropicCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generated by Claude
          </h2>
          <p className="text-gray-600">
            This component was generated based on your brief.
          </p>
          <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;`;

  const googleCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generated by Gemini
          </h2>
          <p className="text-gray-600">
            This component was generated based on your brief.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;`;

  return { anthropic: anthropicCode, google: googleCode };
}

export default CommandCenter;
