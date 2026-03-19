import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Search, RefreshCw, Users, Award, MessageSquare } from "lucide-react";
import { usePendingFinalApprovals, useUpdateFinalApproval } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";

export const FinalApprovalsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: approvals, isLoading, refetch } = usePendingFinalApprovals();
  const updateApproval = useUpdateFinalApproval();
  
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const filtered = approvals?.filter((a: any) =>
    (a.research?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.research?.research_code || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAction = async (researchId: string, status: "approved" | "rejected" | "revision_requested") => {
    if (!researchId) return;

    try {
      await updateApproval.mutateAsync({
        researchId,
        status,
        remarks: remarks[researchId],
      });
      show(`Research ${status === "approved" ? "approved and archived" : status === "revision_requested" ? "sent for revision" : "rejected"}!`, "success");
      setRemarks({ ...remarks, [researchId]: "" });
      setExpandedId(null);
    } catch (err: any) {
      show(err.message, "error");
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 skeleton-shimmer rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 size={20} className="text-primary" /> Final Approvals
          </h1>
          <p className="text-sm text-muted-foreground">Review and approve defended research projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-11 px-4 rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
        <Search size={14} className="text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or code..."
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground flex-1"
        />
      </div>

      {!filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No pending approvals</p>
          <p className="text-xs text-muted-foreground mt-1">All defended research has been approved or is being revised.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((approval: any) => {
            return (
              <div
                key={approval.id}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{approval.research?.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{approval.research?.research_code}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {approval.research?.research_members?.slice(0, 3).map((member: any, idx: number) => (
                          <span key={idx} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            {member.member_name}
                          </span>
                        ))}
                        {(approval.research?.research_members?.length || 0) > 3 && (
                          <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            +{(approval.research?.research_members?.length || 0) - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        Pending
                      </span>
                      <span className={`transition-transform ${expandedId === approval.id ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </button>

                {expandedId === approval.id && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/20 animate-slide-down">
                    {/* Group Members */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Users size={12} /> Group Members
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {approval.research?.research_members?.map((member: any, idx: number) => (
                          <span key={idx} className="text-xs bg-background px-2.5 py-1 rounded border border-border text-foreground">
                            {member.member_name}
                            {member.is_leader && <span className="ml-1 text-primary font-semibold">(Leader)</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Panelist Grades Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Award size={12} /> Panelist Grades ({(approval.defense_grades || []).length})
                      </p>
                      <DefenseGradesDisplay grades={approval.defense_grades || []} />
                    </div>

                    {/* Remarks Textarea */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        <MessageSquare size={12} className="inline mr-1" /> Staff Remarks
                      </label>
                      <textarea
                        value={remarks[approval.id] || ""}
                        onChange={(e) => setRemarks({ ...remarks, [approval.id]: e.target.value })}
                        placeholder="Add remarks for the research team (optional)"
                        className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(approval.research?.id, "approved")}
                        disabled={updateApproval.isPending}
                        className="flex-1 h-10 rounded-lg bg-success/10 text-success font-semibold text-sm hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {updateApproval.isPending ? (
                          <div className="h-3 w-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Approve & Archive
                      </button>
                      <button
                        onClick={() => handleAction(approval.research?.id, "revision_requested")}
                        disabled={updateApproval.isPending}
                        className="flex-1 h-10 rounded-lg bg-warning/10 text-warning font-semibold text-sm hover:bg-warning/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {updateApproval.isPending ? (
                          <div className="h-3 w-3 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        Request Revision
                      </button>
                      <button
                        onClick={() => handleAction(approval.research?.id, "rejected")}
                        disabled={updateApproval.isPending}
                        className="flex-1 h-10 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {updateApproval.isPending ? (
                          <div className="h-3 w-3 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper component to display defense grades
const DefenseGradesDisplay: React.FC<{ grades: any[] }> = ({ grades }) => {
  if (!grades || grades.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No defense grades submitted yet</p>;
  }

  const averageGrade = grades.reduce((sum, g) => sum + (Number(g.grade) || 0), 0) / grades.length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {grades.map((grade, idx) => (
          <div key={idx} className="bg-background border border-border rounded-lg p-2">
            <p className="text-xs text-muted-foreground">{grade.profiles?.full_name}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-foreground">{Number(grade.grade).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            {grade.remarks && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{grade.remarks}</p>
            )}
          </div>
        ))}
      </div>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mt-2">
        <p className="text-xs text-primary font-semibold">Average Grade</p>
        <p className="text-lg font-bold text-primary">{averageGrade.toFixed(1)} / 100</p>
      </div>
    </div>
  );
};
