"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Search,
  Menu,
  Command,
  LayoutDashboard,
  Activity,
  Shield,
  HeartPulse,
  CheckCircle,
  Lightbulb,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Keyboard,
  CreditCard,
  Github,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme";
import { NotificationsDropdown } from "@/components/notifications";
import { useState } from "react";

const pageConfig: Record<string, { name: string; parent?: string }> = {
  "/command-center": { name: "Command Center" },
  "/dashboard": { name: "Dashboard" },
  "/operations": { name: "Operations" },
  "/approvals": { name: "Approvals" },
  "/self-healing": { name: "Self-Healing" },
  "/completions": { name: "Completions" },
  "/ideas": { name: "Ideas Backlog" },
  "/settings": { name: "Settings" },
  "/jobs": { name: "Job Details", parent: "/completions" },
};

const mobileNav = [
  { name: "Command Center", href: "/command-center", icon: Command },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Operations", href: "/operations", icon: Activity },
  { name: "Approvals", href: "/approvals", icon: Shield },
  { name: "Self-Healing", href: "/self-healing", icon: HeartPulse },
  { name: "Completions", href: "/completions", icon: CheckCircle },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Get current page and breadcrumb info
  const getPageInfo = () => {
    // Check for dynamic routes like /jobs/[id]
    if (pathname.startsWith("/jobs/")) {
      return pageConfig["/jobs"];
    }
    return pageConfig[pathname] || { name: "Chimera" };
  };

  const pageInfo = getPageInfo();
  const parentPage = pageInfo.parent ? pageConfig[pageInfo.parent] : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Command className="h-5 w-5" />
                Chimera
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {mobileNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb / Page Title */}
        <div className="flex-1 flex items-center gap-2">
          {parentPage ? (
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href={pageInfo.parent!}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {parentPage.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pageInfo.name}</span>
            </nav>
          ) : (
            <h2 className="font-semibold text-lg">{pageInfo.name}</h2>
          )}

          {/* Search - Desktop */}
          <div className="hidden lg:flex relative max-w-sm ml-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search... (⌘K)"
              className="pl-8 w-64 h-9"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              readOnly
            />
          </div>
        </div>

        {/* Quick Actions - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/command-center")}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Job
          </Button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings?tab=billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings?tab=github")}>
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Keyboard shortcuts
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
