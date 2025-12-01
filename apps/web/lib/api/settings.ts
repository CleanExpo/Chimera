/**
 * User Settings API client for persisting preferences to Supabase
 */

import { createClient } from "@/lib/supabase/client";

export interface UserSettings {
  user_id: string;

  // AI Model Preferences
  default_model: string;
  fallback_model: string;
  max_tokens: number;
  temperature: number;

  // Self-Healing Configuration
  self_healing_enabled: boolean;
  auto_fix_tier: number;

  // Notification Preferences
  notifications_enabled: boolean;
  notify_on_completion: boolean;
  notify_on_approval_needed: boolean;
  notify_on_incident: boolean;
  email_notifications: boolean;

  // UI Preferences
  theme: "light" | "dark" | "system";
  sidebar_collapsed: boolean;
  show_thought_streams: boolean;
  compact_mode: boolean;

  // API Keys status
  anthropic_api_key_set: boolean;
  google_api_key_set: boolean;
  openrouter_api_key_set: boolean;

  // GitHub Integration
  github_connected: boolean;
  github_default_repo: string | null;
  github_default_branch: string;

  // Usage Limits
  daily_token_limit: number;
  daily_cost_limit: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<UserSettings, "user_id" | "created_at" | "updated_at">>;

/**
 * Get current user's settings
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no settings exist, create default ones
    if (error.code === "PGRST116") {
      return createDefaultSettings(user.id);
    }
    console.error("Failed to fetch settings:", error);
    return null;
  }

  return data as UserSettings;
}

/**
 * Create default settings for a user
 */
async function createDefaultSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) {
    console.error("Failed to create default settings:", error);
    return null;
  }

  return data as UserSettings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(updates: SettingsUpdate): Promise<UserSettings | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update settings:", error);
    throw new Error(error.message);
  }

  return data as UserSettings;
}

/**
 * Subscribe to settings changes
 */
export function subscribeToSettings(
  onUpdate: (settings: UserSettings) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("user-settings")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "user_settings",
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as UserSettings);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
