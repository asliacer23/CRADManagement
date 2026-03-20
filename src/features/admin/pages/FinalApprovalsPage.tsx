import React, { useMemo, useState } from "react";
import { AlertCircle, Award, CheckCircle2, Eye, MessageSquare, RefreshCw, Users, XCircle } from "lucide-react";
import { usePendingFinalApprovals, useUpdateFinalApproval } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

export const FinalApprovalsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: approvals, isLoading, refetch } = usePendingFinalApprovals();
  const updateApproval = useUpdateFinalApproval();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [memberFilter, setMemberFilter] = useState("");

  const filteredApprovals = useMemo(
    () =>
      (approvals || []).filter((approval: any) => {
        const target = `${approval.research?.title || ""} ${approval.research?.research_code || ""}`.toLowerCase();
        const memberCount = String(approval.research?.research_members?.length || 0);
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesMembers = !memberFilter || memberCount === memberFilter;
        return matchesSearch && matchesMembers;
      }),
    [approvals, memberFilter, search]
  );

  const memberOptions = Array.from(
    new Set((approvals || []).map((approval: any) => String(approval.research?.research_members?.length || 0)))
  ).sort((left, right) => Number(left) - Number(right));

  const handleAction = async (researchId: string, status: "approved" | "rejected" | "revision_requested") => {
    if (!researchId) return;

    try {
      await updateApproval.mutateAsync({
        researchId,
        status,
        remarks: remarks[researchId],
      });

      show(
        `Research ${status === "approved" ? "approved and archived" : status === "revision_requested" ? "sent for revision" : "rejected"}!`,
        "success"
      );
      setRemarks((previous) => ({ ...previous, [researchId]: "" }));
      setExpandedId(null);
    } catch (error: any) {
      show(error.message, "error");
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Final Approvals"
        description="Review defended research, inspect submitted grades, and finalize the outcome."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title or code..."
        filters={[
          {
            key: "members",
            label: "Members",
            value: memberFilter,
            onChange: setMemberFilter,
            options: [{ label: "All", value: "" }, ...memberOptions.map((value) => ({ label: `${value} members`, value }))],
          },
        ]}
        actions={
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
        stats={[
          <div key="pending" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-foreground">{approvals?.length || 0}</p>
          </div>,
        ]}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Research</th>
                <th className="px-4 py-3 text-left font-semibold">Members</th>
                <th className="px-4 py-3 text-left font-semibold">Grades</th>
                <th className="px-4 py-3 text-left font-semibold">Average</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredApprovals.length ? (
                <EmptyTableState
                  colSpan={6}
                  title="No pending approvals"
                  description="Defended research waiting for a final decision will appear here."
                />
              ) : (
                filteredApprovals.map((approval: any) => {
                  const grades = approval.defense_grades || [];
                  const averageGrade = grades.length
                    ? grades.reduce((sum: number, grade: any) => sum + (Number(grade.grade) || 0), 0) / grades.length
                    : null;

                  return (
                    <React.Fragment key={approval.id}>
                      <tr className="border-t border-border/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{approval.research?.title}</p>
                          <p className="text-xs font-mono text-muted-foreground">{approval.research?.research_code}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{approval.research?.research_members?.length || 0}</td>
                        <td className="px-4 py-3 text-muted-foreground">{grades.length} submitted</td>
                        <td className="px-4 py-3 text-muted-foreground">{averageGrade !== null ? averageGrade.toFixed(1) : "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">Pending</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Eye size={13} />
                            {expandedId === approval.id ? "Hide" : "Review"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === approval.id ? (
                        <tr className="border-t border-border/40 bg-muted/20">
                          <td colSpan={6} className="px-4 py-4">
                            <FinalApprovalDetails
                              approval={approval}
                              remarks={remarks[approval.research?.id] || ""}
                              loading={updateApproval.isPending}
                              onRemarksChange={(value) =>
                                setRemarks((previous) => ({
                                  ...previous,
                                  [approval.research?.id]: value,
                                }))
                              }
                              onApprove={() => handleAction(approval.research?.id, "approved")}
                              onRevise={() => handleAction(approval.research?.id, "revision_requested")}
                              onReject={() => handleAction(approval.research?.id, "rejected")}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinalApprovalDetails: React.FC<{
  approval: any;
  remarks: string;
  loading: boolean;
  onRemarksChange: (value: string) => void;
  onApprove: () => void;
  onRevise: () => void;
  onReject: () => void;
}> = ({ approval, remarks, loading, onRemarksChange, onApprove, onRevise, onReject }) => {
  const grades = approval.defense_grades || [];
  const averageGrade = grades.length
    ? grades.reduce((sum: number, grade: any) => sum + (Number(grade.grade) || 0), 0) / grades.length
    : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Members" value={`${approval.research?.research_members?.length || 0}`} icon={<Users size={13} />} />
        <MetricCard label="Grades" value={`${grades.length}`} icon={<Award size={13} />} />
        <MetricCard label="Average" value={averageGrade !== null ? `${averageGrade.toFixed(1)} / 100` : "Not available"} icon={<CheckCircle2 size={13} />} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Group Members</p>
        <div className="flex flex-wrap gap-2">
          {(approval.research?.research_members || []).map((member: any, index: number) => (
            <span key={`${member.member_name}-${index}`} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
              {member.member_name}
              {member.is_leader ? " (Leader)" : ""}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panelist Grades</p>
        {grades.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade: any) => (
              <div key={grade.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{grade.profiles?.full_name}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{Number(grade.grade).toFixed(1)} / 100</p>
                {grade.remarks ? <p className="mt-1 text-xs italic text-muted-foreground">{grade.remarks}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">No defense grades submitted yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquare size={12} className="mr-1 inline" />
            Staff Remarks
          </p>
          <textarea
            value={remarks}
            onChange={(event) => onRemarksChange(event.target.value)}
            placeholder="Add remarks for the research team..."
            className="h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-success/10 px-4 text-sm font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            Approve and Archive
          </button>
          <button
            onClick={onRevise}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
          >
            <AlertCircle size={15} />
            Request Revision
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-background px-3 py-3">
    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
  </div>
);
