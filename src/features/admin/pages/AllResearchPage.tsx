import React, { useState } from "react";
import { BookOpen, Search, Filter, Users, Calendar } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useAllResearch } from "@/shared/hooks/useSupabaseData";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const COLORS = ["hsl(225, 73%, 30%)", "hsl(200, 80%, 55%)", "hsl(142, 71%, 35%)", "hsl(38, 92%, 50%)", "hsl(355, 80%, 45%)", "hsl(215, 16%, 47%)", "hsl(280, 60%, 50%)", "hsl(160, 60%, 40%)"];

export const AllResearchPage: React.FC = () => {
  const { data: research, isLoading } = useAllResearch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = research?.filter((r: any) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusCounts: Record<string, number> = {};
  research?.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const statuses = Object.keys(statusCounts);

  if (isLoading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="h-7 w-48 skeleton-shimmer rounded" />
      <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={5} cols={5} /></div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen size={20} className="text-primary" /> All Research</h1>
          <p className="text-sm text-muted-foreground">{research?.length || 0} total submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
          </div>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter("")} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!statusFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
          All ({research?.length || 0})
        </button>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
            {s} ({statusCounts[s]})
          </button>
        ))}
      </div>

      {pieData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Research by Status</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No research found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Code</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Submitted By</div>
            <div className="col-span-2">Adviser</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Status</div>
          </div>
          {filtered.map((r: any) => {
            const adviser = r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned";
            const submitter = r.profiles?.full_name || "Unknown";
            return (
              <div key={r.id} className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors items-center min-h-[44px]">
                <div className="col-span-2 text-xs font-mono text-muted-foreground">{r.research_code}</div>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  {r.departments?.name && <p className="text-[10px] text-muted-foreground">{r.departments.name}</p>}
                </div>
                <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <Users size={12} className="flex-shrink-0" /> {submitter}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground truncate">{adviser}</div>
                <div className="col-span-1 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d")}</div>
                <div className="col-span-2"><StatusBadge variant={r.status}>{r.status}</StatusBadge></div>
              </div>
            );
          })}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((r: any) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{r.research_code}</span>
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                </div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  By {r.profiles?.full_name || "Unknown"} · Adviser: {r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
