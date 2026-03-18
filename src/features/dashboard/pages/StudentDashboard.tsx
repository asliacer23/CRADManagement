import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDashboardStats, useMyResearch, useNotifications } from "@/shared/hooks/useSupabaseData";
import { StatSkeleton, CardSkeleton } from "@/shared/components/Skeletons";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { FileText, Upload, CreditCard, Calendar, Bell, Clock, CheckCircle2, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(225, 73%, 30%)", "hsl(200, 80%, 55%)", "hsl(142, 71%, 35%)", "hsl(38, 92%, 50%)", "hsl(355, 80%, 45%)"];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats("student");
  const { data: research, isLoading: researchLoading } = useMyResearch();
  const { data: notifications } = useNotifications();

  const loading = statsLoading || researchLoading;

  const statCards = [
    { label: "Total Research", value: stats?.totalResearch ?? 0, icon: <FileText size={18} />, color: "text-primary" },
    { label: "Pending Review", value: stats?.pendingReview ?? 0, icon: <Clock size={18} />, color: "text-warning" },
    { label: "Approved", value: stats?.approved ?? 0, icon: <CheckCircle2 size={18} />, color: "text-success" },
    { label: "Unread Notifications", value: stats?.unreadNotifs ?? 0, icon: <Bell size={18} />, color: "text-secondary" },
  ];

  const quickActions = [
    { label: "Submit Research", icon: <FileText size={16} />, path: "/research/submit" },
    { label: "Upload Manuscript", icon: <Upload size={16} />, path: "/manuscripts/upload" },
    { label: "Upload Payment", icon: <CreditCard size={16} />, path: "/payments" },
    { label: "View Schedule", icon: <Calendar size={16} />, path: "/defense" },
  ];

  // Pie chart data from research statuses
  const statusCounts: Record<string, number> = {};
  research?.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 skeleton-shimmer rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const unreadNotifs = notifications?.filter((n: any) => !n.is_read).slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
          Good day, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here's your research progress overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/20 transition-all min-h-[44px] group">
              <span className="text-muted-foreground group-hover:text-primary transition-colors">{a.icon}</span>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> My Research
            </h2>
            <button onClick={() => navigate("/research/my")} className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          {!research?.length ? (
            <div className="p-8 text-center">
              <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No research yet. Submit your first research!</p>
              <button onClick={() => navigate("/research/submit")} className="mt-3 text-xs text-primary font-semibold hover:underline">Submit Research →</button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {research.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.research_code}</p>
                  </div>
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell size={16} className="text-primary" /> Notifications
            </h2>
            {unreadNotifs.length > 0 && (
              <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-bold">{unreadNotifs.length} new</span>
            )}
          </div>
          {unreadNotifs.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unreadNotifs.map((n: any) => (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px] bg-primary/[0.02]">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Research Status Distribution</h2>
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
    </div>
  );
};
