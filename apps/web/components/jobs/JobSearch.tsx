"use client";

import { useState, useCallback } from "react";
import { Search, X, SlidersHorizontal, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type TeamFilter = "anthropic" | "google" | "all";

export interface JobFilters {
  search: string;
  statuses: JobStatus[];
  teams: TeamFilter[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface JobSearchProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  totalResults?: number;
}

const statusOptions: { value: JobStatus; label: string; color: string }[] = [
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "running", label: "Running", color: "bg-blue-500" },
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "failed", label: "Failed", color: "bg-red-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
];

const teamOptions: { value: TeamFilter; label: string }[] = [
  { value: "all", label: "All Teams" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
];

export function JobSearch({ filters, onFiltersChange, totalResults }: JobSearchProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handleStatusToggle = (status: JobStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleTeamToggle = (team: TeamFilter) => {
    if (team === "all") {
      onFiltersChange({ ...filters, teams: ["all"] });
    } else {
      const newTeams = filters.teams.filter((t) => t !== "all");
      const updated = newTeams.includes(team)
        ? newTeams.filter((t) => t !== team)
        : [...newTeams, team];
      onFiltersChange({ ...filters, teams: updated.length ? updated : ["all"] });
    }
  };

  const handleDateSelect = (range: { from: Date | undefined; to?: Date | undefined }) => {
    onFiltersChange({
      ...filters,
      dateRange: { from: range.from, to: range.to || range.from },
    });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({
      search: "",
      statuses: [],
      teams: ["all"],
      dateRange: { from: undefined, to: undefined },
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.statuses.length > 0 ||
    !filters.teams.includes("all") ||
    filters.dateRange.from;

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.statuses.length +
    (filters.teams.includes("all") ? 0 : filters.teams.length) +
    (filters.dateRange.from ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or brief..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Status
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filters.statuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.statuses.includes(option.value)}
                onCheckedChange={() => handleStatusToggle(option.value)}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${option.color}`} />
                  {option.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Team Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Team
              {!filters.teams.includes("all") && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filters.teams.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Filter by Team</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {teamOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={
                  option.value === "all"
                    ? filters.teams.includes("all")
                    : filters.teams.includes(option.value as TeamFilter)
                }
                onCheckedChange={() => handleTeamToggle(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "MMM d")} -{" "}
                    {format(filters.dateRange.to, "MMM d")}
                  </>
                ) : (
                  format(filters.dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Date Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={handleDateSelect as (range: { from: Date | undefined; to?: Date | undefined } | undefined) => void}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Results Count */}
      {typeof totalResults === "number" && (
        <p className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? "job" : "jobs"} found
        </p>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: &quot;{filters.search}&quot;
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.statuses.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1 capitalize">
              {status}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleStatusToggle(status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
