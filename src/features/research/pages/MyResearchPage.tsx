import React, { useState } from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useMyResearch } from "@/shared/hooks/useSupabaseData";
import { BookOpen, Search, Users, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export const MyResearchPage: React.FC = () => {
  const { data: research, isLoading } = useMyResearch();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = research?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen size={20} className="text-primary" /> My Research</h1>
          <p className="text-sm text-muted-foreground">Track all your submitted research ({filtered.length} total)</p>
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
          {/* Desktop table */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Code</div><div className="col-span-3">Title</div><div className="col-span-2">Category</div><div className="col-span-2">Adviser</div><div className="col-span-1">Date</div><div className="col-span-2">Status</div>
          </div>
          {filtered.map((r: any) => {
            const adviser = r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned";
            const category = r.research_categories?.name || "—";
            const isExpanded = expandedId === r.id;
            const members = r.research_members || [];
            return (
              <React.Fragment key={r.id}>
                <div onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer items-center min-h-[44px]">
                  <div className="col-span-2 text-xs font-mono text-muted-foreground">{r.research_code}</div>
                  <div className="col-span-3 text-sm font-medium text-foreground truncate">{r.title}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">{category}</div>
                  <div className="col-span-2 text-sm text-muted-foreground truncate">{adviser}</div>
                  <div className="col-span-1 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d")}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="hidden sm:block px-4 py-3 bg-muted/20 border-b border-border/50 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Abstract</p>
                        <p className="text-sm text-foreground">{r.abstract || "No abstract provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Group Members ({members.length})</p>
                        {members.length > 0 ? (
                          <div className="space-y-1">
                            {members.map((m: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                                <Users size={12} className="text-muted-foreground" />
                                {m.member_name}
                                {m.is_leader && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Leader</span>}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground">No members listed</p>}
                        {r.departments?.name && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Department</p>
                            <p className="text-sm text-foreground">{r.departments.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {/* Mobile view */}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((r: any) => (
              <div key={r.id} className="p-4 space-y-2" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{r.research_code}</span>
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                </div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  Adviser: {r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned"}
                </p>
                {expandedId === r.id && (
                  <div className="pt-2 border-t border-border/50 animate-fade-in space-y-2">
                    <p className="text-xs text-foreground">{r.abstract || "No abstract"}</p>
                    {r.research_members?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Members: {r.research_members.map((m: any) => m.member_name).join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
