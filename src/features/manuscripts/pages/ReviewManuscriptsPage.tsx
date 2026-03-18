import React, { useState } from "react";
import { ClipboardCheck, Search, Download, CheckCircle2, XCircle, RotateCcw, FileText, Calendar, User } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useManuscripts, useUpdateManuscriptStatus } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const ReviewManuscriptsPage: React.FC = () => {
  const { data: manuscripts, isLoading } = useManuscripts();
  const updateStatus = useUpdateManuscriptStatus();
  const { show } = useSnackbar();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = manuscripts?.filter((m: any) => {
    const matchesSearch = (m.research?.title || "").toLowerCase().includes(search.toLowerCase()) || (m.file_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleAction = async (m: any, status: string) => {
    try {
      await updateStatus.mutateAsync({
        manuscriptId: m.id,
        status,
        userId: m.uploaded_by,
        title: m.research?.title || "",
      });
      show(`Manuscript ${status.replace("_", " ")}`, "success");
    } catch (err: any) {
      show(err.message || "Action failed", "error");
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("manuscripts").download(fileUrl);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      show("Download failed: " + err.message, "error");
    }
  };

  const statusCounts: Record<string, number> = {};
  manuscripts?.forEach((m: any) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck size={20} className="text-primary" /> Review Manuscripts</h1>
          <p className="text-sm text-muted-foreground">{manuscripts?.length || 0} manuscripts submitted</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter("")} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!statusFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
          All
        </button>
        {Object.entries(statusCounts).map(([s, c]) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
            {s.replace("_", " ")} ({c})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={3} cols={4} /></div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ClipboardCheck size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No manuscripts to review</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((m: any) => (
            <div key={m.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge variant={m.status}>{m.status.replace("_", " ")}</StatusBadge>
                    <span className="text-xs text-muted-foreground">v{m.version_number}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{m.research?.title || "Untitled"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><User size={11} /> {m.profiles?.full_name || "Unknown"}</span>
                    <span className="flex items-center gap-1"><FileText size={11} /> {m.file_name || "No file"}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(m.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                {m.file_url && (
                  <button onClick={() => handleDownload(m.file_url, m.file_name || "manuscript")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
              {m.version_notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">{m.version_notes}</p>
              )}
              {["submitted", "under_review"].includes(m.status) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleAction(m, "approved")} disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => handleAction(m, "revision_needed")} disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-warning text-warning-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    <RotateCcw size={14} /> Revision
                  </button>
                  <button onClick={() => handleAction(m, "rejected")} disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
