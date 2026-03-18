import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { BookOpen, Search, Filter } from "lucide-react";

const mockData = [
  { id: "R-2024-001", title: "IoT-Based Smart Classroom Monitoring System", status: "review" as const, adviser: "Dr. Maria Santos", date: "Mar 15, 2026", members: 4 },
  { id: "R-2024-002", title: "AI-Powered Student Performance Predictor", status: "pending" as const, adviser: "Pending Assignment", date: "Mar 10, 2026", members: 3 },
  { id: "R-2024-003", title: "Blockchain-Based Credential Verification", status: "approved" as const, adviser: "Dr. Maria Santos", date: "Feb 28, 2026", members: 5 },
];

export const MyResearchPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = mockData.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-primary" /> My Research
          </h1>
          <p className="text-sm text-muted-foreground">Track all your submitted research</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TableSkeleton rows={3} cols={4} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Title</div>
              <div className="col-span-3">Adviser</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Status</div>
            </div>
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer items-center min-h-[44px]">
                <div className="col-span-1 text-xs font-mono text-muted-foreground">{r.id}</div>
                <div className="col-span-4 text-sm font-medium text-foreground truncate">{r.title}</div>
                <div className="col-span-3 text-sm text-muted-foreground">{r.adviser}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{r.date}</div>
                <div className="col-span-2"><StatusBadge variant={r.status}>{r.status}</StatusBadge></div>
              </div>
            ))}
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((r) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                </div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.adviser} · {r.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
