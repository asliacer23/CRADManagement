import React, { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useAllResearch } from "@/shared/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(225, 73%, 30%)", "hsl(200, 80%, 55%)", "hsl(142, 71%, 35%)", "hsl(38, 92%, 50%)", "hsl(355, 80%, 45%)", "hsl(215, 16%, 47%)"];

export const AllResearchPage: React.FC = () => {
  const { data: research, isLoading } = useAllResearch();
  const [search, setSearch] = useState("");
  const filtered = research?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  const statusCounts: Record<string, number> = {};
  research?.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen size={20} className="text-primary" /> All Research</h1>
          <p className="text-sm text-muted-foreground">Complete overview of all research submissions ({research?.length || 0} total)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
        </div>
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
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name} · {r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned"}
                </p>
              </div>
              <StatusBadge variant={r.status}>{r.status}</StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
