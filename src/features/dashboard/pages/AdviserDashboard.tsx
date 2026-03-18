import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDashboardStats, useResearchByAdviser } from "@/shared/hooks/useSupabaseData";
import { StatSkeleton } from "@/shared/components/Skeletons";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { FileText, Users, CheckCircle2, Clock, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const AdviserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats("adviser");
  const { data: research, isLoading: researchLoading } = useResearchByAdviser();

  const loading = statsLoading || researchLoading;

  const statCards = [
    { label: "Assigned Students", value: stats?.assignedStudents ?? 0, icon: <Users size={18} />, color: "text-primary" },
    { label: "Pending Reviews", value: stats?.pendingReviews ?? 0, icon: <Clock size={18} />, color: "text-warning" },
    { label: "Approved", value: stats?.approved ?? 0, icon: <CheckCircle2 size={18} />, color: "text-success" },
  ];

  const statusCounts: Record<string, number> = {};
  research?.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 skeleton-shimmer rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Welcome, {user?.name?.split(" ").pop()}! 📚</h1>
        <p className="text-sm text-muted-foreground">Manuscripts and research awaiting your review</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Research by Status</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(225, 73%, 30%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Assigned Research
          </h2>
        </div>
        {!research?.length ? (
          <div className="p-8 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No research assigned to you yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {research.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name}
                  </p>
                </div>
                <StatusBadge variant={r.status}>{r.status}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
