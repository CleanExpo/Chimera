/**
 * GitHub Authentication Hook
 *
 * Manages GitHub OAuth state and provides helper functions.
 */

"use client";

import { useState, useEffect } from "react";
import type { GitHubUser } from "@/lib/github/types";
import { validateToken } from "@/lib/github/client";

export interface UseGitHubAuthReturn {
  isConnected: boolean;
  user: GitHubUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshAuth: () => void;
}

/**
 * Get GitHub user from cookies
 */
function getGitHubUserFromCookie(): GitHubUser | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const userCookie = cookies.find((c) => c.startsWith("github_user="));

  if (!userCookie) return null;

  try {
    const userData = decodeURIComponent(userCookie.split("=")[1]);
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Get GitHub token from server
 */
async function getGitHubToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/github/token");
    if (!response.ok) return null;
    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export function useGitHubAuth(): UseGitHubAuthReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user from cookie (public data)
      const githubUser = getGitHubUserFromCookie();

      // Get token from server (secure)
      const token = await getGitHubToken();

      if (githubUser && token) {
        // Validate token
        const isValid = await validateToken(token);

        if (isValid) {
          setUser(githubUser);
          setAccessToken(token);
          setIsConnected(true);
        } else {
          // Token is invalid, clear everything
          await disconnect();
          setError("GitHub token is invalid or expired");
        }
      } else {
        setIsConnected(false);
        setUser(null);
        setAccessToken(null);
      }
    } catch (err) {
      console.error("[useGitHubAuth] Error loading auth:", err);
      setError(err instanceof Error ? err.message : "Failed to load GitHub auth");
      setIsConnected(false);
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuth();

    // Check for connection success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("github_connected") === "true") {
      // Reload auth after successful connection
      setTimeout(loadAuth, 500);

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("github_connected");
      window.history.replaceState({}, "", newUrl.toString());
    }

    // Check for errors in URL
    const githubError = params.get("github_error");
    if (githubError) {
      setError(decodeURIComponent(githubError));

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("github_error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  const connect = () => {
    // Redirect to OAuth flow
    const returnTo = window.location.pathname;
    window.location.href = `/api/github/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const disconnect = async () => {
    try {
      await fetch("/api/github/disconnect", { method: "POST" });
      setIsConnected(false);
      setUser(null);
      setAccessToken(null);
      setError(null);
    } catch (err) {
      console.error("[useGitHubAuth] Disconnect error:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const refreshAuth = () => {
    loadAuth();
  };

  return {
    isConnected,
    user,
    accessToken,
    loading,
    error,
    connect,
    disconnect,
    refreshAuth,
  };
}
