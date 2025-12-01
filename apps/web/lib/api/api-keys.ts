/**
 * API Key Management
 * Handles secure storage and validation of API keys
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8888";

export type APIProvider = "anthropic" | "google" | "openrouter";

export interface APIKeyStatus {
  provider: APIProvider;
  isSet: boolean;
  isValid: boolean;
  lastValidated?: string;
  error?: string;
}

export interface APIKeysStatus {
  anthropic: APIKeyStatus;
  google: APIKeyStatus;
  openrouter: APIKeyStatus;
}

export interface SetAPIKeyPayload {
  provider: APIProvider;
  apiKey: string;
}

export interface ValidateAPIKeyResponse {
  valid: boolean;
  provider: APIProvider;
  error?: string;
  models?: string[];
}

/**
 * Get current API key status (without exposing actual keys)
 */
export async function getAPIKeysStatus(): Promise<APIKeysStatus> {
  const response = await fetch(`${BACKEND_URL}/api/settings/api-keys/status`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get API keys status");
  }

  return response.json();
}

/**
 * Set an API key for a provider
 */
export async function setAPIKey(payload: SetAPIKeyPayload): Promise<APIKeyStatus> {
  const response = await fetch(`${BACKEND_URL}/api/settings/api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to set API key" }));
    throw new Error(error.detail || "Failed to set API key");
  }

  return response.json();
}

/**
 * Remove an API key for a provider
 */
export async function removeAPIKey(provider: APIProvider): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/settings/api-keys/${provider}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to remove API key" }));
    throw new Error(error.detail || "Failed to remove API key");
  }
}

/**
 * Validate an API key without storing it
 */
export async function validateAPIKey(
  provider: APIProvider,
  apiKey: string
): Promise<ValidateAPIKeyResponse> {
  const response = await fetch(`${BACKEND_URL}/api/settings/api-keys/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, apiKey }),
  });

  if (!response.ok) {
    return {
      valid: false,
      provider,
      error: "Failed to validate API key",
    };
  }

  return response.json();
}

/**
 * Client-side validation helpers
 */
export function isValidAnthropicKeyFormat(key: string): boolean {
  return key.startsWith("sk-ant-") && key.length > 20;
}

export function isValidGoogleKeyFormat(key: string): boolean {
  return key.startsWith("AI") && key.length > 20;
}

export function isValidOpenRouterKeyFormat(key: string): boolean {
  return key.startsWith("sk-or-") && key.length > 20;
}

export function validateKeyFormat(provider: APIProvider, key: string): { valid: boolean; error?: string } {
  switch (provider) {
    case "anthropic":
      if (!isValidAnthropicKeyFormat(key)) {
        return { valid: false, error: "Anthropic keys should start with 'sk-ant-'" };
      }
      break;
    case "google":
      if (!isValidGoogleKeyFormat(key)) {
        return { valid: false, error: "Google AI keys should start with 'AI'" };
      }
      break;
    case "openrouter":
      if (!isValidOpenRouterKeyFormat(key)) {
        return { valid: false, error: "OpenRouter keys should start with 'sk-or-'" };
      }
      break;
  }
  return { valid: true };
}

/**
 * Mask an API key for display
 */
export function maskAPIKey(key: string): string {
  if (key.length < 12) return "****";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}
