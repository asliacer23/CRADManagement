import React, { useState } from "react";
import { UserCheck, Search, CheckCircle2, XCircle, Users, Calendar } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useResearchByAdviser, useUpdateResearchStatus } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { format } from "date-fns";

export const ApproveResearchPage: React.FC = () => {
  const { data: research, isLoading } = useResearchByAdviser();
  const updateStatus = useUpdateResearchStatus();
  const { show } = useSnackbar();
  const [search, setSearch] = useState("");

  const filtered = research?.filter((r: any) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const pendingItems = filtered.filter((r: any) => ["pending", "review"].includes(r.status));
  const otherItems = filtered.filter((r: any) => !["pending", "review"].includes(r.status));

  const handleAction = async (r: any, status: string) => {
    try {
      await updateStatus.mutateAsync({
        researchId: r.id,
        status,
        userId: r.submitted_by,
        title: r.title,
      });
      show(`Research ${status} successfully`, "success");
    } catch (err: any) {
      show(err.message || "Action failed", "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><UserCheck size={20} className="text-primary" /> Approve Research</h1>
          <p className="text-sm text-muted-foreground">{pendingItems.length} pending review · {research?.length || 0} total assigned</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={3} cols={4} /></div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <UserCheck size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No research assigned to you</p>
          <p className="text-xs text-muted-foreground mt-1">When research is assigned, it will appear here for review</p>
        </div>
      ) : (
        <>
          {pendingItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Pending Review ({pendingItems.length})</h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {pendingItems.map((r: any) => (
                  <div key={r.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{r.research_code}</span>
                          <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{r.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users size={11} /> {r.profiles?.full_name || "Unknown"}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(r.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    {r.abstract && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">{r.abstract}</p>
                    )}
                    {r.research_members?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Members: {r.research_members.map((m: any) => m.member_name).join(", ")}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleAction(r, "approved")} disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => handleAction(r, "revision")} disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-warning text-warning-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                        Revision Needed
                      </button>
                      <button onClick={() => handleAction(r, "rejected")} disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Reviewed ({otherItems.length})</h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {otherItems.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[44px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name || "Unknown"}
                      </p>
                    </div>
                    <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
