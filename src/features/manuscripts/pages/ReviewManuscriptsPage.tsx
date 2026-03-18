import React from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { ClipboardCheck, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useManuscripts, useUpdateManuscriptStatus } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";

export const ReviewManuscriptsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: manuscripts, isLoading } = useManuscripts();
  const updateStatus = useUpdateManuscriptStatus();
  const pending = manuscripts?.filter((m: any) => ["submitted", "under_review"].includes(m.status)) || [];

  const handleAction = async (m: any, status: string) => {
    try {
      await updateStatus.mutateAsync({ manuscriptId: m.id, status, userId: m.uploaded_by, title: m.research?.title || "" });
      show(`Manuscript ${status}!`, status === "approved" ? "success" : "warning");
    } catch (err: any) { show(err.message, "error"); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck size={20} className="text-primary" /> Review Manuscripts</h1>
        <p className="text-sm text-muted-foreground">Review and provide feedback on student manuscripts</p>
      </div>
      {!pending.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
          <p className="text-sm font-medium text-foreground">No manuscripts pending review</p>
        </div>
      ) : pending.map((m: any) => (
        <div key={m.id} className="bg-card border border-border rounded-xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{m.research?.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono">{m.research?.research_code}</span> · {m.profiles?.full_name} · v{m.version_number}
              </p>
              {m.file_name && <p className="text-xs text-primary mt-1">📎 {m.file_name}</p>}
              {m.version_notes && <p className="text-xs text-muted-foreground mt-1 italic">"{m.version_notes}"</p>}
            </div>
            <StatusBadge variant={m.status === "submitted" ? "pending" : "review"}>{m.status}</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleAction(m, "approved")} disabled={updateStatus.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors min-h-[44px]"><CheckCircle2 size={14} /> Approve</button>
            <button onClick={() => handleAction(m, "revision_needed")} disabled={updateStatus.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warning/10 text-warning text-xs font-semibold hover:bg-warning/20 transition-colors min-h-[44px]"><MessageSquare size={14} /> Needs Revision</button>
            <button onClick={() => handleAction(m, "rejected")} disabled={updateStatus.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors min-h-[44px]"><XCircle size={14} /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
};
