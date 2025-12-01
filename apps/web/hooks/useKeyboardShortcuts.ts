"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: ShortcutHandler;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts for power users
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      key: "c",
      ctrl: true,
      shift: true,
      description: "Go to Command Center",
      handler: () => router.push("/command-center"),
    },
    {
      key: "d",
      ctrl: true,
      shift: true,
      description: "Go to Dashboard",
      handler: () => router.push("/dashboard"),
    },
    {
      key: "o",
      ctrl: true,
      shift: true,
      description: "Go to Operations",
      handler: () => router.push("/operations"),
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      description: "Go to Approvals",
      handler: () => router.push("/approvals"),
    },
    {
      key: ",",
      ctrl: true,
      description: "Go to Settings",
      handler: () => router.push("/settings"),
    },
    // Action shortcuts
    {
      key: "k",
      ctrl: true,
      description: "Open Command Palette",
      handler: () => {
        // Dispatch custom event for command palette
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      },
    },
    {
      key: "n",
      ctrl: true,
      shift: true,
      description: "New Job",
      handler: () => {
        window.dispatchEvent(new CustomEvent("new-job"));
      },
    },
    {
      key: "/",
      ctrl: true,
      description: "Focus Search",
      handler: () => {
        window.dispatchEvent(new CustomEvent("focus-search"));
      },
    },
    {
      key: "Escape",
      description: "Close Modal/Cancel",
      handler: () => {
        window.dispatchEvent(new CustomEvent("escape-pressed"));
      },
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (event.key !== "Escape") {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return { shortcuts };
}

/**
 * Hook for listening to custom shortcut events
 */
export function useShortcutEvent(
  eventName: string,
  handler: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const listener = () => handler();
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [eventName, handler, ...deps]);
}

/**
 * Get shortcut display string (e.g., "Ctrl+Shift+C")
 */
export function getShortcutDisplay(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.meta) parts.push("⌘");

  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
}
