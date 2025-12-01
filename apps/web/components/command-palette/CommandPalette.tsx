"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Command as CommandIcon,
  LayoutDashboard,
  Activity,
  Shield,
  HeartPulse,
  CheckCircle,
  Lightbulb,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  FileCode,
  GitBranch,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useShortcutEvent } from "@/hooks/useKeyboardShortcuts";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  // Listen for keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Listen for custom event from keyboard shortcuts
  useShortcutEvent("open-command-palette", () => setOpen(true));

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigation = [
    { name: "Command Center", href: "/command-center", icon: CommandIcon, shortcut: "⌃⇧C" },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "⌃⇧D" },
    { name: "Operations", href: "/operations", icon: Activity, shortcut: "⌃⇧O" },
    { name: "Approvals", href: "/approvals", icon: Shield, shortcut: "⌃⇧A" },
    { name: "Self-Healing", href: "/self-healing", icon: HeartPulse },
    { name: "Completions", href: "/completions", icon: CheckCircle },
    { name: "Ideas", href: "/ideas", icon: Lightbulb },
    { name: "Settings", href: "/settings", icon: Settings, shortcut: "⌃," },
  ];

  const actions = [
    {
      name: "New Job",
      icon: Plus,
      shortcut: "⌃⇧N",
      action: () => {
        router.push("/command-center");
        window.dispatchEvent(new CustomEvent("new-job"));
      },
    },
    {
      name: "Search Jobs",
      icon: Search,
      action: () => router.push("/completions"),
    },
    {
      name: "View Recent Code",
      icon: FileCode,
      action: () => router.push("/completions"),
    },
    {
      name: "GitHub Repos",
      icon: GitBranch,
      action: () => router.push("/settings?tab=github"),
    },
  ];

  const themeOptions = [
    { name: "Light Mode", icon: Sun, action: () => setTheme("light") },
    { name: "Dark Mode", icon: Moon, action: () => setTheme("dark") },
    { name: "System Theme", icon: Monitor, action: () => setTheme("system") },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigation.map((item) => (
            <CommandItem
              key={item.name}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actions.map((item) => (
            <CommandItem
              key={item.name}
              onSelect={() => runCommand(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          {themeOptions.map((item) => (
            <CommandItem
              key={item.name}
              onSelect={() => runCommand(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings?tab=profile"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/login"))}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
