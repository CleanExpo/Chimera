"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getUserSettings,
  updateUserSettings,
  subscribeToSettings,
  type UserSettings,
  type SettingsUpdate,
} from "@/lib/api/settings";

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: SettingsUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user settings with Supabase persistence
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (updates: SettingsUpdate) => {
    try {
      const updated = await updateUserSettings(updates);
      if (updated) {
        setSettings(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update settings"));
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToSettings((updated) => {
      setSettings(updated);
    });

    return unsubscribe;
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings: update,
    refresh: fetchSettings,
  };
}
