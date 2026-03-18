import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDashboardStats, useAuditLogs, useResearchChartData } from "@/shared/hooks/useSupabaseData";
import { StatSkeleton } from "@/shared/components/Skeletons";
import { Users, FileText, ShieldCheck, Calendar, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format } from "date-fns";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats("admin");
  const { data: logs, isLoading: logsLoading } = useAuditLogs();
  const { data: chartData } = useResearchChartData();

  const loading = statsLoading || logsLoading;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: <Users size={18} />, color: "text-primary" },
    { label: "Total Research", value: stats?.totalResearch ?? 0, icon: <FileText size={18} />, color: "text-secondary" },
    { label: "Active Defense", value: stats?.activeDefense ?? 0, icon: <Calendar size={18} />, color: "text-success" },
  ];

  // Monthly research trend
  const monthlyData: Record<string, number> = {};
  chartData?.forEach((r: any) => {
    const month = format(new Date(r.created_at), "MMM yyyy");
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });
  const trendData = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));

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
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Admin Dashboard ⚡</h1>
        <p className="text-sm text-muted-foreground">System overview and management</p>
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

      {trendData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Research Submissions Trend
          </h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(200, 80%, 55%)" strokeWidth={2} dot={{ fill: "hsl(225, 73%, 30%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" /> Recent Activity Logs
          </h2>
        </div>
        {!logs?.length ? (
          <div className="p-8 text-center">
            <ShieldCheck size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No activity logs yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
                <span className="text-[10px] font-mono font-bold bg-muted px-2 py-1 rounded text-muted-foreground w-auto text-center flex-shrink-0">{log.action}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.details || log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.profiles?.email || "System"}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap hidden sm:block">
                  {format(new Date(log.created_at), "MMM d, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
