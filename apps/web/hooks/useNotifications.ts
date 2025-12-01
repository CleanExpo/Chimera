"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  useNotificationsStore,
  notifyJobComplete,
  notifyApprovalNeeded,
  notifyIncidentDetected,
  notifyIncidentResolved,
  notifyExportComplete,
  notifySystemMessage,
  type NotificationType,
  type Notification,
} from "@/lib/stores/notifications-store";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import React from "react";

const toastIcons: Record<NotificationType, React.ReactNode> = {
  success: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  error: React.createElement(XCircle, { className: "h-4 w-4 text-red-500" }),
  warning: React.createElement(AlertTriangle, { className: "h-4 w-4 text-yellow-500" }),
  info: React.createElement(Info, { className: "h-4 w-4 text-blue-500" }),
};

interface UseNotificationsReturn {
  // Store state
  notifications: Notification[];
  unreadCount: number;

  // Store actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Toast + Store notifications
  notifyWithToast: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      persist?: boolean;
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => void;

  // Pre-built notification functions
  jobComplete: (jobId: string, title: string, success: boolean) => void;
  approvalNeeded: (approvalId: string, title: string, riskLevel: string) => void;
  incidentDetected: (incidentId: string, title: string, tier: number) => void;
  incidentResolved: (incidentId: string, title: string) => void;
  exportComplete: (jobId: string, destination: "download" | "github") => void;
  systemMessage: (title: string, message: string, type?: NotificationType) => void;
}

/**
 * Hook for managing notifications with both toast and persistent storage
 */
export function useNotifications(): UseNotificationsReturn {
  const store = useNotificationsStore();

  const notifyWithToast = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        persist?: boolean;
        actionUrl?: string;
        actionLabel?: string;
      }
    ) => {
      // Show toast
      const toastFn = {
        success: toast.success,
        error: toast.error,
        warning: toast.warning,
        info: toast.info,
      }[type];

      toastFn(title, {
        description: message,
        icon: toastIcons[type],
        action: options?.actionUrl
          ? {
              label: options.actionLabel || "View",
              onClick: () => {
                window.location.href = options.actionUrl!;
              },
            }
          : undefined,
      });

      // Also add to persistent store if requested
      if (options?.persist !== false) {
        store.addNotification({
          type,
          category: "system",
          title,
          message,
          actionUrl: options?.actionUrl,
          actionLabel: options?.actionLabel,
        });
      }
    },
    [store]
  );

  const jobComplete = useCallback(
    (jobId: string, title: string, success: boolean) => {
      notifyJobComplete(jobId, title, success);

      if (success) {
        toast.success("Job Complete", {
          description: `${title} has completed successfully`,
          icon: toastIcons.success,
        });
      } else {
        toast.error("Job Failed", {
          description: `${title} has failed`,
          icon: toastIcons.error,
        });
      }
    },
    []
  );

  const approvalNeeded = useCallback(
    (approvalId: string, title: string, riskLevel: string) => {
      notifyApprovalNeeded(approvalId, title, riskLevel);

      const isHighRisk = riskLevel === "critical" || riskLevel === "high";
      const toastFn = isHighRisk ? toast.warning : toast.info;

      toastFn("Approval Required", {
        description: `"${title}" needs your review`,
        icon: isHighRisk ? toastIcons.warning : toastIcons.info,
        action: {
          label: "Review",
          onClick: () => {
            window.location.href = `/approvals?id=${approvalId}`;
          },
        },
      });
    },
    []
  );

  const incidentDetected = useCallback(
    (incidentId: string, title: string, tier: number) => {
      notifyIncidentDetected(incidentId, title, tier);

      const toastFn = tier === 3 ? toast.error : tier === 2 ? toast.warning : toast.info;
      const icon = tier === 3 ? toastIcons.error : tier === 2 ? toastIcons.warning : toastIcons.info;

      toastFn("Incident Detected", {
        description: `${title} (Tier ${tier})`,
        icon,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = `/self-healing?incident=${incidentId}`;
          },
        },
      });
    },
    []
  );

  const incidentResolved = useCallback((incidentId: string, title: string) => {
    notifyIncidentResolved(incidentId, title);

    toast.success("Incident Resolved", {
      description: `${title} has been resolved`,
      icon: toastIcons.success,
    });
  }, []);

  const exportComplete = useCallback(
    (jobId: string, destination: "download" | "github") => {
      notifyExportComplete(jobId, destination);

      toast.success("Export Complete", {
        description:
          destination === "github"
            ? "Code pushed to GitHub repository"
            : "Code downloaded successfully",
        icon: toastIcons.success,
      });
    },
    []
  );

  const systemMessage = useCallback(
    (title: string, message: string, type: NotificationType = "info") => {
      notifySystemMessage(title, message, type);

      const toastFn = {
        success: toast.success,
        error: toast.error,
        warning: toast.warning,
        info: toast.info,
      }[type];

      toastFn(title, {
        description: message,
        icon: toastIcons[type],
      });
    },
    []
  );

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    removeNotification: store.removeNotification,
    clearAll: store.clearAll,
    notifyWithToast,
    jobComplete,
    approvalNeeded,
    incidentDetected,
    incidentResolved,
    exportComplete,
    systemMessage,
  };
}
