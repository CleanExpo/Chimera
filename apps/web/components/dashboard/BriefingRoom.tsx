"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BriefingRoomProps {
  onSubmit: (brief: string, framework: "react" | "vanilla" | "vue" | "svelte") => void;
  isLoading?: boolean;
}

export function BriefingRoom({ onSubmit, isLoading = false }: BriefingRoomProps) {
  const [brief, setBrief] = useState("");
  const [framework, setFramework] = useState<"react" | "vanilla" | "vue" | "svelte">("react");

  const handleSubmit = () => {
    if (brief.trim() && !isLoading) {
      onSubmit(brief.trim(), framework);
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
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Framework:</label>
          <Select
            value={framework}
            onValueChange={(value) => setFramework(value as "react" | "vanilla" | "vue" | "svelte")}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="svelte">Svelte</SelectItem>
              <SelectItem value="vanilla">Vanilla JS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="e.g., Create a responsive pricing card component with three tiers: Basic, Pro, and Enterprise. Include monthly/yearly toggle, feature lists, and CTA buttons..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[150px] resize-none"
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
