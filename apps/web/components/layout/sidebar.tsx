"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Command,
  Activity,
  Shield,
  HeartPulse,
  CheckCircle,
  Lightbulb,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Command Center", href: "/command-center", icon: Command, description: "Main control hub" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & metrics" },
  { name: "Operations", href: "/operations", icon: Activity, description: "Agent status & health" },
  { name: "Approvals", href: "/approvals", icon: Shield, description: "Review AI decisions" },
  { name: "Self-Healing", href: "/self-healing", icon: HeartPulse, description: "Autonomy settings" },
  { name: "Completions", href: "/completions", icon: CheckCircle, description: "Job history & audit" },
  { name: "Ideas", href: "/ideas", icon: Lightbulb, description: "AI suggestions" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Configuration" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/40 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Command className="h-5 w-5 text-primary" />
            <span>Chimera</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <Command className="h-5 w-5 text-primary" />
          </Link>
        )}
        {onToggle && !collapsed && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors group relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"
                  )}>
                    {item.description}
                  </span>
                </div>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with collapse toggle */}
      {onToggle && collapsed && (
        <div className="border-t p-2">
          <Button variant="ghost" size="icon" onClick={onToggle} className="w-full h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
