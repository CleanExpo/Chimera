"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";

interface BriefingRoomProps {
  onSubmit: (brief: string) => void;
  isLoading?: boolean;
}

export function BriefingRoom({ onSubmit, isLoading = false }: BriefingRoomProps) {
  const [brief, setBrief] = useState("");

  const handleSubmit = () => {
    if (brief.trim() && !isLoading) {
      onSubmit(brief.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Briefing Room
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Describe what you want to build in natural language
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <Textarea
          placeholder="e.g., Create a responsive pricing card component with three tiers: Basic, Pro, and Enterprise. Include monthly/yearly toggle, feature lists, and CTA buttons..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[200px] resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ⌘ + Enter to transmit
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!brief.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Transmit Brief
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BriefingRoom;
