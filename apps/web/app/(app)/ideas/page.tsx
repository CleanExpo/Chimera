"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Bug,
  Zap,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  Search,
  Filter,
  Plus,
  Bot,
  User,
} from "lucide-react";

type IdeaCategory = "feature" | "optimization" | "bugfix" | "pattern" | "refactor";
type IdeaSource = "ai" | "user";
type IdeaPriority = "low" | "medium" | "high" | "critical";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  source: IdeaSource;
  priority: IdeaPriority;
  confidence?: number;
  upvotes: number;
  downvotes: number;
  comments: number;
  createdAt: string;
  reasoning?: string;
  relatedFiles?: string[];
}

const mockIdeas: Idea[] = [
  {
    id: "idea-1",
    title: "Implement Redis Caching Layer",
    description: "Add Redis caching for frequently accessed API responses to reduce database load and improve response times by ~60%",
    category: "optimization",
    source: "ai",
    priority: "high",
    confidence: 0.89,
    upvotes: 12,
    downvotes: 1,
    comments: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reasoning: "Detected repeated database queries for the same data patterns. Caching could reduce p95 latency from 450ms to 180ms.",
    relatedFiles: ["apps/backend/src/api/routes/", "apps/backend/src/database/"],
  },
  {
    id: "idea-2",
    title: "Add WebSocket Connection Pooling",
    description: "Implement connection pooling for WebSocket connections to handle higher concurrent user loads",
    category: "feature",
    source: "ai",
    priority: "medium",
    confidence: 0.76,
    upvotes: 8,
    downvotes: 2,
    comments: 3,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reasoning: "Current WebSocket implementation creates new connections per user. Pooling would reduce memory footprint by ~40%.",
  },
  {
    id: "idea-3",
    title: "Extract Common UI Patterns",
    description: "Create reusable component library from repeated patterns across dashboard pages",
    category: "refactor",
    source: "ai",
    priority: "low",
    confidence: 0.92,
    upvotes: 15,
    downvotes: 0,
    comments: 8,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reasoning: "Identified 12 instances of similar card layouts and 8 instances of similar table structures that could be abstracted.",
    relatedFiles: ["apps/web/components/dashboard/", "apps/web/components/operations/"],
  },
  {
    id: "idea-4",
    title: "Fix Memory Leak in ThoughtStream",
    description: "ThoughtStream component accumulates DOM nodes without cleanup, causing performance degradation over time",
    category: "bugfix",
    source: "ai",
    priority: "critical",
    confidence: 0.95,
    upvotes: 20,
    downvotes: 0,
    comments: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reasoning: "Memory profiling showed linear memory growth correlating with thought stream updates. useEffect cleanup is missing.",
    relatedFiles: ["apps/web/components/dashboard/ThoughtStream.tsx"],
  },
  {
    id: "idea-5",
    title: "Add Rate Limiting Dashboard",
    description: "Create a visual dashboard to monitor and configure API rate limits per user/endpoint",
    category: "feature",
    source: "user",
    priority: "medium",
    upvotes: 6,
    downvotes: 1,
    comments: 4,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "idea-6",
    title: "Implement Circuit Breaker Pattern",
    description: "Add circuit breaker for external API calls to prevent cascade failures",
    category: "pattern",
    source: "ai",
    priority: "high",
    confidence: 0.84,
    upvotes: 9,
    downvotes: 0,
    comments: 1,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    reasoning: "External AI model calls occasionally timeout, causing request queues to build up. Circuit breaker would improve resilience.",
  },
];

const categoryConfig: Record<IdeaCategory, { icon: React.ElementType; color: string; label: string }> = {
  feature: { icon: Sparkles, color: "text-blue-500 bg-blue-500/10", label: "Feature" },
  optimization: { icon: Zap, color: "text-yellow-500 bg-yellow-500/10", label: "Optimization" },
  bugfix: { icon: Bug, color: "text-red-500 bg-red-500/10", label: "Bug Fix" },
  pattern: { icon: TrendingUp, color: "text-purple-500 bg-purple-500/10", label: "Pattern" },
  refactor: { icon: Lightbulb, color: "text-green-500 bg-green-500/10", label: "Refactor" },
};

const priorityConfig: Record<IdeaPriority, { color: string; label: string }> = {
  low: { color: "text-gray-500", label: "Low" },
  medium: { color: "text-blue-500", label: "Medium" },
  high: { color: "text-orange-500", label: "High" },
  critical: { color: "text-red-500", label: "Critical" },
};

function IdeaCard({ idea, onVote }: { idea: Idea; onVote: (id: string, type: "up" | "down") => void }) {
  const category = categoryConfig[idea.category];
  const priority = priorityConfig[idea.priority];
  const CategoryIcon = category.icon;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Voting */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onVote(idea.id, "up")}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {idea.upvotes - idea.downvotes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onVote(idea.id, "down")}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("shrink-0", category.color)}>
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {category.label}
                </Badge>
                <Badge variant="outline" className={priority.color}>
                  {priority.label}
                </Badge>
                {idea.source === "ai" && (
                  <Badge variant="secondary" className="shrink-0">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
                {idea.source === "user" && (
                  <Badge variant="secondary" className="shrink-0">
                    <User className="h-3 w-3 mr-1" />
                    User Submitted
                  </Badge>
                )}
              </div>
              {idea.confidence && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(idea.confidence * 100)}% confident
                </span>
              )}
            </div>

            <h4 className="font-medium mb-1">{idea.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>

            {idea.reasoning && (
              <div className="text-xs bg-muted/50 p-2 rounded mb-3">
                <span className="font-medium">AI Reasoning:</span> {idea.reasoning}
              </div>
            )}

            {idea.relatedFiles && idea.relatedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {idea.relatedFiles.map((file) => (
                  <Badge key={file} variant="outline" className="text-xs font-mono">
                    {file}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {idea.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  Discuss
                </Button>
                <Button size="sm">
                  Implement
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleVote = (id: string, type: "up" | "down") => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              upvotes: type === "up" ? idea.upvotes + 1 : idea.upvotes,
              downvotes: type === "down" ? idea.downvotes + 1 : idea.downvotes,
            }
          : idea
      )
    );
  };

  const filteredIdeas = ideas
    .filter((idea) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter((idea) => {
      if (activeTab === "ai") return idea.source === "ai";
      if (activeTab === "user") return idea.source === "user";
      if (activeTab === "critical") return idea.priority === "critical" || idea.priority === "high";
      return true;
    })
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

  const aiIdeasCount = ideas.filter((i) => i.source === "ai").length;
  const criticalCount = ideas.filter((i) => i.priority === "critical" || i.priority === "high").length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Ideas Backlog
          </h1>
          <p className="text-muted-foreground">
            AI-generated suggestions and improvement recommendations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Submit Idea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Lightbulb className="h-4 w-4" />
              <span className="text-xs">Total Ideas</span>
            </div>
            <p className="text-2xl font-bold">{ideas.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bot className="h-4 w-4" />
              <span className="text-xs">AI Generated</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{aiIdeasCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">High Priority</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{criticalCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">Top Voted</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {Math.max(...ideas.map((i) => i.upvotes - i.downvotes))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Tabs and Ideas List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({ideas.length})</TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="h-4 w-4 mr-1" />
            AI Generated ({aiIdeasCount})
          </TabsTrigger>
          <TabsTrigger value="user">
            <User className="h-4 w-4 mr-1" />
            User Submitted ({ideas.length - aiIdeasCount})
          </TabsTrigger>
          <TabsTrigger value="critical">
            <TrendingUp className="h-4 w-4 mr-1" />
            High Priority ({criticalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
              ))}
              {filteredIdeas.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No ideas found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
