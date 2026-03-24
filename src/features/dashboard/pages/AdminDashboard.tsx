import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Activity,
  ArrowRight,
  Archive,
  BellRing,
  BookOpen,
  Calendar,
  CreditCard,
  FileClock,
  FileText,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminDashboardAnalytics } from "@/shared/hooks/useSupabaseData";
import { StatSkeleton, TableSkeleton } from "@/shared/components/Skeletons";
import { StatusBadge } from "@/shared/components/StatusBadge";

const PIE_COLORS = ["#0f766e", "#2563eb", "#d97706", "#16a34a", "#dc2626", "#7c3aed", "#475569"];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAdminDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-56 skeleton-shimmer rounded" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "The admin dashboard data could not be loaded."}
        </p>
      </div>
    );
  }

  const {
    summary,
    roleCounts,
    researchStatusCounts,
    paymentStatusCounts,
    defenseStatusCounts,
    approvalStatusCounts,
    manuscriptStatusCounts,
    departmentAnalytics,
    pendingPaymentsList,
    pendingApprovalsList,
    upcomingDefenses,
    recentLogs,
    recentAnnouncements,
    recentResearch,
    chartData,
  } = data;

  const monthlyResearchData = chartData.reduce((acc: Record<string, number>, item: any) => {
    const key = format(new Date(item.created_at), "MMM yyyy");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(monthlyResearchData).map(([month, count]) => ({ month, count }));
  const researchPieData = Object.entries(researchStatusCounts).map(([name, value]) => ({ name, value }));

  const analyticsRows = [
    {
      label: "Research Pipeline",
      open: researchStatusCounts.pending || 0,
      inProgress: (researchStatusCounts.review || 0) + (researchStatusCounts.revision || 0) + (researchStatusCounts.pending_final_approval || 0),
      completed: (researchStatusCounts.approved || 0) + (researchStatusCounts.archived || 0) + (researchStatusCounts.completed || 0),
      total: summary.totalResearch,
    },
    {
      label: "Payments",
      open: (paymentStatusCounts.pending || 0) + (paymentStatusCounts.submitted || 0),
      inProgress: 0,
      completed: paymentStatusCounts.verified || 0,
      total: Object.values(paymentStatusCounts).reduce((sum, value) => sum + value, 0),
    },
    {
      label: "Manuscripts",
      open: manuscriptStatusCounts.submitted || 0,
      inProgress: (manuscriptStatusCounts.under_review || 0) + (manuscriptStatusCounts.revision_needed || 0),
      completed: manuscriptStatusCounts.approved || 0,
      total: Object.values(manuscriptStatusCounts).reduce((sum, value) => sum + value, 0),
    },
    {
      label: "Defense Workflow",
      open: defenseStatusCounts.scheduled || 0,
      inProgress: approvalStatusCounts.pending || 0,
      completed: defenseStatusCounts.completed || 0,
      total: Object.values(defenseStatusCounts).reduce((sum, value) => sum + value, 0),
    },
    {
      label: "User Accounts",
      open: roleCounts.student || 0,
      inProgress: (roleCounts.adviser || 0) + (roleCounts.staff || 0),
      completed: roleCounts.admin || 0,
      total: summary.totalUsers,
    },
  ];

  const statCards = [
    { label: "Total Users", value: summary.totalUsers, icon: <Users size={18} />, tone: "text-sky-700 bg-sky-50 border-sky-200" },
    { label: "Total Research", value: summary.totalResearch, icon: <BookOpen size={18} />, tone: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { label: "Pending Research", value: summary.pendingResearch, icon: <FileClock size={18} />, tone: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Pending Manuscripts", value: summary.pendingManuscripts, icon: <FileText size={18} />, tone: "text-purple-700 bg-purple-50 border-purple-200" },
    { label: "Pending Payments", value: summary.pendingPayments, icon: <CreditCard size={18} />, tone: "text-rose-700 bg-rose-50 border-rose-200" },
    { label: "Scheduled Defenses", value: summary.scheduledDefenses, icon: <Calendar size={18} />, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Pending Final Approvals", value: summary.pendingFinalApprovals, icon: <ShieldCheck size={18} />, tone: "text-orange-700 bg-orange-50 border-orange-200" },
    { label: "Archived Research", value: summary.archivedResearch, icon: <Archive size={18} />, tone: "text-slate-700 bg-slate-50 border-slate-200" },
  ];

  const quickActions = [
    {
      label: "Review Final Approvals",
      helper: "Clear defended research waiting for a CRAD decision.",
      value: `${summary.pendingFinalApprovals} pending`,
      path: "/admin/final-approvals",
      icon: <ShieldCheck size={16} className="text-orange-600" />,
    },
    {
      label: "Manage Defense Schedule",
      helper: "Create or update upcoming defense sessions and rooms.",
      value: `${summary.scheduledDefenses} scheduled`,
      path: "/defense",
      icon: <Calendar size={16} className="text-emerald-600" />,
    },
    {
      label: "Publish Announcement",
      helper: "Post institute-wide notices for students, advisers, and staff.",
      value: `${summary.totalAnnouncements} live notices`,
      path: "/announcements",
      icon: <BellRing size={16} className="text-primary" />,
    },
    {
      label: "Open Archive",
      helper: "Inspect completed records and archive-ready summaries.",
      value: `${summary.archivedResearch} archived`,
      path: "/archive",
      icon: <Archive size={16} className="text-slate-600" />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500" /> Admin Command Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live analytics across users, research, manuscripts, payments, defenses, approvals, and announcements.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="font-semibold">
              <Link to="/integrations/hr-staff-request">
                <UserPlus className="mr-2 h-4 w-4" />
                Request staff from HR
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-auto">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Announcements</p>
            <p className="mt-1 text-xl font-bold text-foreground">{summary.totalAnnouncements}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Staff + Advisers</p>
            <p className="mt-1 text-xl font-bold text-foreground">{(roleCounts.staff || 0) + (roleCounts.adviser || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${card.tone}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
              {card.icon}
            </div>
            <p className="mt-4 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">CRAD Action Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump directly into the live modules that need action from CRAD administration.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-xl bg-muted/50 p-2">{action.icon}</div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{action.label}</p>
              <p className="mt-1 text-xs font-medium text-primary">{action.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{action.helper}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Research Submission Trend
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#0f172a", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Research Status Mix
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={researchPieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45} paddingAngle={3}>
                  {researchPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Operational Analytics Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Area</th>
                  <th className="px-4 py-3 text-left font-semibold">Open</th>
                  <th className="px-4 py-3 text-left font-semibold">In Progress</th>
                  <th className="px-4 py-3 text-left font-semibold">Completed</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {analyticsRows.map((row) => (
                  <tr key={row.label} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                    <td className="px-4 py-3 text-amber-700 font-semibold">{row.open}</td>
                    <td className="px-4 py-3 text-sky-700 font-semibold">{row.inProgress}</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">{row.completed}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Role Distribution</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "Students", value: roleCounts.student || 0, color: "bg-sky-500" },
              { label: "Advisers", value: roleCounts.adviser || 0, color: "bg-indigo-500" },
              { label: "Staff", value: roleCounts.staff || 0, color: "bg-emerald-500" },
              { label: "Admins", value: roleCounts.admin || 0, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${summary.totalUsers ? (item.value / summary.totalUsers) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardListCard
          title="Pending Payment Queue"
          icon={<CreditCard size={16} className="text-rose-600" />}
          emptyMessage="No pending payment verification queue."
          items={pendingPaymentsList.map((item: any) => ({
            title: item.research?.title || "Unknown research",
            meta: `${item.payment_code} · ${item.submitted_by_profile?.full_name || "Unknown"} · PHP ${Number(item.amount).toLocaleString()}`,
            badge: item.status,
          }))}
        />

        <DashboardListCard
          title="Pending Final Approvals"
          icon={<ShieldCheck size={16} className="text-orange-600" />}
          emptyMessage="No pending final approvals."
          items={pendingApprovalsList.map((item: any) => ({
            title: item.research?.title || "Unknown research",
            meta: `${item.research?.research_code || "No code"} · ${format(new Date(item.created_at), "MMM d, yyyy")}`,
            badge: item.status,
          }))}
        />

        <DashboardListCard
          title="Upcoming Defenses"
          icon={<Calendar size={16} className="text-emerald-600" />}
          emptyMessage="No upcoming defenses on schedule."
          items={upcomingDefenses.map((item: any) => ({
            title: item.research?.title || "Unknown research",
            meta: `${format(new Date(item.defense_date), "MMM d, yyyy")} · ${item.defense_time} · ${item.room}`,
            badge: item.status,
          }))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Department Analytics</h2>
          </div>
          {!departmentAnalytics.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No department analytics available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Department</th>
                    <th className="px-4 py-3 text-left font-semibold">Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Total</th>
                    <th className="px-4 py-3 text-left font-semibold">Active</th>
                    <th className="px-4 py-3 text-left font-semibold">Archived</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentAnalytics.map((row: any) => (
                    <tr key={row.code} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium text-foreground">{row.department}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.code}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{row.totalResearch}</td>
                      <td className="px-4 py-3 text-sky-700 font-semibold">{row.activePipeline}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{row.archived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BellRing size={16} className="text-primary" /> Recent Announcements
              </h2>
            </div>
            {!recentAnnouncements.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No announcements published yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentAnnouncements.map((item: any) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.created_at), "MMM d, yyyy h:mm a")}</p>
                      </div>
                      {item.is_pinned && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">Pinned</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserCog size={16} className="text-primary" /> Recent Research Activity
              </h2>
            </div>
            {!recentResearch.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No research activity yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentResearch.map((item: any) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.research_code} · {item.profiles?.full_name || "Unknown"} · {item.departments?.code || "N/A"}
                        </p>
                      </div>
                      <StatusBadge variant={item.status}>{item.status}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" /> Recent Activity Logs
          </h2>
        </div>
        {!recentLogs.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No activity logs yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">{log.action}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{log.details || log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.profiles?.email || log.profiles?.full_name || "System"}</p>
                </div>
                <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">
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

function DashboardListCard({
  title,
  icon,
  emptyMessage,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  emptyMessage: string;
  items: { title: string; meta: string; badge: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon} {title}
        </h2>
      </div>
      {!items.length ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.meta}</p>
                </div>
                <StatusBadge variant={item.badge}>{item.badge}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
