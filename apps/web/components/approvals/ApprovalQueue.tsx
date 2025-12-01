"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApprovalCard, type ApprovalItem, type ApprovalStatus } from "./ApprovalCard";
import {
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  SortAsc,
} from "lucide-react";

interface ApprovalQueueProps {
  items: ApprovalItem[];
  onApprove: (id: string, feedback?: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestChanges: (id: string, changes: string) => void;
  onPreview?: (id: string) => void;
}

export function ApprovalQueue({
  items,
  onApprove,
  onReject,
  onRequestChanges,
  onPreview,
}: ApprovalQueueProps) {
  const [activeTab, setActiveTab] = useState<ApprovalStatus | "all">("pending");

  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((item) => item.status === activeTab);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;

  // Sort by risk level (critical first) then by date
  const sortedItems = [...filteredItems].sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Approval Queue
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-yellow-500">
              {pendingCount} Pending
            </Badge>
            <Badge variant="secondary">{items.length} Total</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApprovalStatus | "all")}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items in this queue</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  onApprove={onApprove}
                  onReject={onReject}
                  onRequestChanges={onRequestChanges}
                  onPreview={onPreview}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
