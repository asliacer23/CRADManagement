import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDashboardStats, usePendingPayments } from "@/shared/hooks/useSupabaseData";
import { StatSkeleton } from "@/shared/components/Skeletons";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { CreditCard, Calendar, Users, Archive } from "lucide-react";

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats("staff");
  const { data: payments, isLoading: paymentsLoading } = usePendingPayments();

  const loading = statsLoading || paymentsLoading;

  const statCards = [
    { label: "Pending Payments", value: stats?.pendingPayments ?? 0, icon: <CreditCard size={18} />, color: "text-warning" },
    { label: "Total Research", value: stats?.totalResearch ?? 0, icon: <Archive size={18} />, color: "text-secondary" },
    { label: "Scheduled Defense", value: stats?.defenseCount ?? 0, icon: <Calendar size={18} />, color: "text-success" },
  ];

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
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Staff Dashboard 🗂️</h1>
        <p className="text-sm text-muted-foreground">Manage payments, schedules, and assignments</p>
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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard size={16} className="text-primary" /> Pending Payment Verifications
          </h2>
        </div>
        {!payments?.length ? (
          <div className="p-8 text-center">
            <CreditCard size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No pending payments to verify.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.payment_code} · {p.research?.research_code}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">₱{Number(p.amount).toLocaleString()}</span>
                <StatusBadge variant={p.status}>{p.status}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
