/**
 * Notifications store for managing app-wide notifications
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationCategory =
  | "job"
  | "approval"
  | "system"
  | "self-healing"
  | "export";

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  maxNotifications: number;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  clearByCategory: (category: NotificationCategory) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      maxNotifications: 100,

      addNotification: (notification) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          read: false,
        };

        set((state) => {
          // Add new notification at the beginning
          const updated = [newNotification, ...state.notifications];

          // Keep only the latest maxNotifications
          const trimmed = updated.slice(0, state.maxNotifications);

          return {
            notifications: trimmed,
            unreadCount: state.unreadCount + 1,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      clearByCategory: (category) => {
        set((state) => {
          const removed = state.notifications.filter(
            (n) => n.category === category
          );
          const unreadRemoved = removed.filter((n) => !n.read).length;

          return {
            notifications: state.notifications.filter(
              (n) => n.category !== category
            ),
            unreadCount: Math.max(0, state.unreadCount - unreadRemoved),
          };
        });
      },
    }),
    {
      name: "chimera-notifications",
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Only persist recent 50
      }),
    }
  )
);

// Helper functions for common notifications
export const notifyJobComplete = (
  jobId: string,
  title: string,
  success: boolean
) => {
  useNotificationsStore.getState().addNotification({
    type: success ? "success" : "error",
    category: "job",
    title: success ? "Job Complete" : "Job Failed",
    message: `${title} has ${success ? "completed successfully" : "failed"}`,
    actionUrl: `/completions?job=${jobId}`,
    actionLabel: "View Details",
    metadata: { jobId },
  });
};

export const notifyApprovalNeeded = (
  approvalId: string,
  title: string,
  riskLevel: string
) => {
  useNotificationsStore.getState().addNotification({
    type: riskLevel === "critical" || riskLevel === "high" ? "warning" : "info",
    category: "approval",
    title: "Approval Required",
    message: `"${title}" needs your review`,
    actionUrl: `/approvals?id=${approvalId}`,
    actionLabel: "Review Now",
    metadata: { approvalId, riskLevel },
  });
};

export const notifyIncidentDetected = (
  incidentId: string,
  title: string,
  tier: number
) => {
  useNotificationsStore.getState().addNotification({
    type: tier === 3 ? "error" : tier === 2 ? "warning" : "info",
    category: "self-healing",
    title: "Incident Detected",
    message: `${title} (Tier ${tier})`,
    actionUrl: `/self-healing?incident=${incidentId}`,
    actionLabel: "View Incident",
    metadata: { incidentId, tier },
  });
};

export const notifyIncidentResolved = (incidentId: string, title: string) => {
  useNotificationsStore.getState().addNotification({
    type: "success",
    category: "self-healing",
    title: "Incident Resolved",
    message: `${title} has been resolved`,
    metadata: { incidentId },
  });
};

export const notifyExportComplete = (
  jobId: string,
  destination: "download" | "github"
) => {
  useNotificationsStore.getState().addNotification({
    type: "success",
    category: "export",
    title: "Export Complete",
    message:
      destination === "github"
        ? "Code pushed to GitHub repository"
        : "Code downloaded successfully",
    metadata: { jobId, destination },
  });
};

export const notifySystemMessage = (
  title: string,
  message: string,
  type: NotificationType = "info"
) => {
  useNotificationsStore.getState().addNotification({
    type,
    category: "system",
    title,
    message,
  });
};
