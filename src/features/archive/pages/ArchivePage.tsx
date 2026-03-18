import React, { useState } from "react";
import { Archive, Search, Download } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useArchivedResearch } from "@/shared/hooks/useSupabaseData";

export const ArchivePage: React.FC = () => {
  const { data: archived, isLoading } = useArchivedResearch();
  const [search, setSearch] = useState("");
  const filtered = archived?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Archive size={20} className="text-primary" /> Research Archive</h1>
          <p className="text-sm text-muted-foreground">Browse completed and archived research</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search archive..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-40" />
        </div>
      </div>
      {!filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Archive size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No archived research</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[44px]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground"><span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name}</p>
              </div>
              <StatusBadge variant={r.status}>{r.status}</StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
