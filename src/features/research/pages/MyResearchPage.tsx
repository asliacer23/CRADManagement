import React, { useState } from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useMyResearch } from "@/shared/hooks/useSupabaseData";
import { BookOpen, Search } from "lucide-react";
import { format } from "date-fns";

export const MyResearchPage: React.FC = () => {
  const { data: research, isLoading } = useMyResearch();
  const [search, setSearch] = useState("");
  const filtered = research?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen size={20} className="text-primary" /> My Research</h1>
          <p className="text-sm text-muted-foreground">Track all your submitted research</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
        </div>
      </div>
      {isLoading ? <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={3} cols={4} /></div> : !filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No research found</p>
          <p className="text-xs text-muted-foreground mt-1">Submit your first research to get started!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Code</div><div className="col-span-4">Title</div><div className="col-span-3">Adviser</div><div className="col-span-1">Date</div><div className="col-span-2">Status</div>
          </div>
          {filtered.map((r: any) => {
            const adviser = r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned";
            return (
              <div key={r.id} className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer items-center min-h-[44px]">
                <div className="col-span-2 text-xs font-mono text-muted-foreground">{r.research_code}</div>
                <div className="col-span-4 text-sm font-medium text-foreground truncate">{r.title}</div>
                <div className="col-span-3 text-sm text-muted-foreground">{adviser}</div>
                <div className="col-span-1 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d")}</div>
                <div className="col-span-2"><StatusBadge variant={r.status}>{r.status}</StatusBadge></div>
              </div>
            );
          })}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((r: any) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="text-xs font-mono text-muted-foreground">{r.research_code}</span><StatusBadge variant={r.status}>{r.status}</StatusBadge></div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
