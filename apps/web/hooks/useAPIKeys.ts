"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getAPIKeysStatus,
  setAPIKey,
  removeAPIKey,
  validateAPIKey,
  validateKeyFormat,
  type APIProvider,
  type APIKeysStatus,
  type APIKeyStatus,
} from "@/lib/api/api-keys";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";

interface UseAPIKeysReturn {
  status: APIKeysStatus | null;
  loading: boolean;
  error: Error | null;

  // Actions
  setKey: (provider: APIProvider, key: string) => Promise<boolean>;
  removeKey: (provider: APIProvider) => Promise<boolean>;
  validateKey: (provider: APIProvider, key: string) => Promise<boolean>;
  refresh: () => Promise<void>;

  // Helpers
  hasAnyKey: boolean;
  hasAllKeys: boolean;
}

const defaultStatus: APIKeysStatus = {
  anthropic: { provider: "anthropic", isSet: false, isValid: false },
  google: { provider: "google", isSet: false, isValid: false },
  openrouter: { provider: "openrouter", isSet: false, isValid: false },
};

/**
 * Hook for managing API keys
 */
export function useAPIKeys(): UseAPIKeysReturn {
  const [status, setStatus] = useState<APIKeysStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { setApiKeyConfigured } = useOnboardingStore();

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAPIKeysStatus();
      setStatus(data);
      setError(null);

      // Update onboarding store
      setApiKeyConfigured("anthropic", data.anthropic.isSet && data.anthropic.isValid);
      setApiKeyConfigured("google", data.google.isSet && data.google.isValid);
    } catch (err) {
      // If backend unavailable, use defaults
      setStatus(defaultStatus);
      setError(err instanceof Error ? err : new Error("Failed to fetch API keys status"));
    } finally {
      setLoading(false);
    }
  }, [setApiKeyConfigured]);

  const setKey = useCallback(async (provider: APIProvider, key: string): Promise<boolean> => {
    // Validate format first
    const formatValidation = validateKeyFormat(provider, key);
    if (!formatValidation.valid) {
      setError(new Error(formatValidation.error));
      return false;
    }

    try {
      setLoading(true);
      const result = await setAPIKey({ provider, apiKey: key });

      // Update local status
      setStatus((prev) => prev ? {
        ...prev,
        [provider]: result,
      } : null);

      // Update onboarding store
      if (provider === "anthropic" || provider === "google") {
        setApiKeyConfigured(provider, result.isValid);
      }

      setError(null);
      return result.isValid;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to set API key"));
      return false;
    } finally {
      setLoading(false);
    }
  }, [setApiKeyConfigured]);

  const removeKeyAction = useCallback(async (provider: APIProvider): Promise<boolean> => {
    try {
      setLoading(true);
      await removeAPIKey(provider);

      // Update local status
      setStatus((prev) => prev ? {
        ...prev,
        [provider]: { provider, isSet: false, isValid: false },
      } : null);

      // Update onboarding store
      if (provider === "anthropic" || provider === "google") {
        setApiKeyConfigured(provider, false);
      }

      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove API key"));
      return false;
    } finally {
      setLoading(false);
    }
  }, [setApiKeyConfigured]);

  const validateKeyAction = useCallback(async (provider: APIProvider, key: string): Promise<boolean> => {
    // Validate format first
    const formatValidation = validateKeyFormat(provider, key);
    if (!formatValidation.valid) {
      setError(new Error(formatValidation.error));
      return false;
    }

    try {
      const result = await validateAPIKey(provider, key);
      if (!result.valid && result.error) {
        setError(new Error(result.error));
      }
      return result.valid;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to validate API key"));
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const hasAnyKey = status
    ? status.anthropic.isSet || status.google.isSet || status.openrouter.isSet
    : false;

  const hasAllKeys = status
    ? status.anthropic.isSet && status.google.isSet
    : false;

  return {
    status,
    loading,
    error,
    setKey,
    removeKey: removeKeyAction,
    validateKey: validateKeyAction,
    refresh: fetchStatus,
    hasAnyKey,
    hasAllKeys,
  };
}
