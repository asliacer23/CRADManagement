import React from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { UserCheck, CheckCircle2, XCircle } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useResearchByAdviser, useUpdateResearchStatus } from "@/shared/hooks/useSupabaseData";

export const ApproveResearchPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research, isLoading } = useResearchByAdviser();
  const updateStatus = useUpdateResearchStatus();
  const pending = research?.filter((r: any) => ["pending", "review"].includes(r.status)) || [];

  const handleAction = async (r: any, status: string) => {
    try {
      await updateStatus.mutateAsync({ researchId: r.id, status, userId: r.submitted_by, title: r.title });
      show(`Research ${status}!`, status === "approved" ? "success" : "error");
    } catch (err: any) { show(err.message, "error"); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><UserCheck size={20} className="text-primary" /> Approve/Reject Research</h1>
        <p className="text-sm text-muted-foreground">Review and decide on research proposals</p>
      </div>
      {!pending.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
          <p className="text-sm font-medium text-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No pending research to review.</p>
        </div>
      ) : pending.map((r: any) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground"><span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name}</p>
              {r.abstract && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.abstract}</p>}
            </div>
            <StatusBadge variant={r.status}>{r.status}</StatusBadge>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction(r, "approved")} disabled={updateStatus.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors min-h-[44px]"><CheckCircle2 size={14} /> Approve</button>
            <button onClick={() => handleAction(r, "rejected")} disabled={updateStatus.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors min-h-[44px]"><XCircle size={14} /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
};
