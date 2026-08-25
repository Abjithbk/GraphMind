"use client";

import { Search, FileText, FlaskConical, Award } from "lucide-react";
import { useGraphStore } from "@/store/useGraphStore";

export function GraphToolbar() {
  const { searchQuery, setSearchQuery, activeFilters, toggleFilter } = useGraphStore();

  const filters = [
    { id: 'paper', label: 'Papers', icon: FileText, color: 'bg-indigo-500' },
    { id: 'method', label: 'Methods', icon: FlaskConical, color: 'bg-emerald-500' },
    { id: 'claim', label: 'Claims', icon: Award, color: 'bg-amber-500' },
  ];

  return (
    <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          className="h-10 w-64 pl-9 pr-3 bg-card/90 backdrop-blur-md border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive 
                  ? "bg-card/90 backdrop-blur-md border-border text-foreground shadow-sm" 
                  : "bg-background/50 border-border/50 text-muted-foreground opacity-50"
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${filter.color}`} />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}