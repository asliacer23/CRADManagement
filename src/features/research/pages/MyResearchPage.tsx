import React, { useState } from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useMyResearch } from "@/shared/hooks/useSupabaseData";
import { BookOpen, Search, Users, Calendar, FileText, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MyResearchPage: React.FC = () => {
  const { data: research, isLoading } = useMyResearch();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const filtered = research?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  const statusTimeline = {
    draft: 1,
    pending: 2,
    review: 3,
    revision: 4,
    approved: 5,
    rejected: "X",
    archived: "A",
    completed: 6,
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-500",
    pending: "bg-orange-500",
    review: "bg-blue-500",
    revision: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    archived: "bg-gray-500",
    completed: "bg-emerald-600",
  };

  const ResearchCard = ({ r }: { r: any }) => {
    const adviser = r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned";
    const category = r.research_categories?.name || "—";
    const isExpanded = expandedId === r.id;
    const members = r.research_members || [];
    const timeAgo = formatDistanceToNow(new Date(r.created_at), { addSuffix: true });
    const lastUpdated = formatDistanceToNow(new Date(r.updated_at), { addSuffix: true });

    return (
      <div
        onClick={() => setExpandedId(isExpanded ? null : r.id)}
        className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-border/50 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-muted-foreground">{r.research_code}</span>
              <StatusBadge variant={r.status}>{r.status}</StatusBadge>
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{r.title}</h3>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-2"><FileText size={12} /> {category}</p>
              <p className="flex items-center gap-2"><Users size={12} /> Adviser: {adviser}</p>
              <p className="flex items-center gap-2"><Clock size={12} /> Created {timeAgo}</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
        </div>

        {isExpanded && (
          <div className="border-t border-border pt-3 space-y-3 animate-fade-in">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Abstract</p>
              <p className="text-sm text-foreground">{r.abstract || "No abstract provided"}</p>
            </div>

            {members.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Members ({members.length})</p>
                <div className="space-y-1">
                  {members.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Users size={12} className="text-muted-foreground" />
                      {m.member_name}
                      {m.is_leader && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Leader</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r.departments?.name && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Department</p>
                <p className="text-sm text-foreground">{r.departments.name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="text-foreground font-medium">{format(new Date(r.created_at), "MMM d, yyyy h:mm a")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="text-foreground font-medium">{format(new Date(r.updated_at), "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={24} className="text-primary" /> My Research
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track all your submitted research ({filtered.length} total)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TableSkeleton rows={3} cols={4} />
        </div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No research found</p>
          <p className="text-xs text-muted-foreground mt-1">Submit your first research to get started!</p>
        </div>
      ) : (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r: any) => (
                <ResearchCard key={r.id} r={r} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-6">
              {filtered.map((r: any) => (
                <div key={r.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 flex items-center justify-center">
                    <div className={`w-4 h-4 ${statusColors[r.status] || "bg-gray-400"} rounded-full border-2 border-card z-10`} />
                  </div>

                  {/* Timeline content */}
                  <div className="ml-8 bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-muted-foreground">{r.research_code}</span>
                          <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">{r.research_categories?.name || "—"}</p>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="text-foreground font-medium">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Updated</p>
                        <p className="text-foreground font-medium">{format(new Date(r.updated_at), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Adviser</p>
                        <p className="text-foreground font-medium truncate">{r.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
