import React, { useMemo, useState } from "react";
import { AlertCircle, Award, CheckCircle2, ClipboardList, Eye, MessageSquare, RefreshCw, ShieldCheck, Users, XCircle } from "lucide-react";
import { usePendingFinalApprovals, useUpdateFinalApproval } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REMARK_TEMPLATES = [
  "Defense outputs are complete and ready for archive release.",
  "Please revise the manuscript wording and resubmit the final package.",
  "Panel findings are promising, but the documentation package is incomplete.",
];

function getApprovalAverage(approval: any) {
  const grades = approval.defense_grades || [];
  if (!grades.length) return null;
  return grades.reduce((sum: number, grade: any) => sum + (Number(grade.grade) || 0), 0) / grades.length;
}

function getRecommendation(approval: any) {
  const grades = approval.defense_grades || [];
  const averageGrade = getApprovalAverage(approval);
  const completedDefense = (approval.research?.defense_schedules || []).some((defense: any) => defense.status === "completed");

  if (!completedDefense || !grades.length) {
    return {
      label: "Incomplete Review",
      tone: "bg-muted text-muted-foreground",
      helper: "A completed defense and panel grades are still required.",
    };
  }

  if (averageGrade !== null && averageGrade >= 90 && grades.length >= 2) {
    return {
      label: "Archive Ready",
      tone: "bg-success/10 text-success",
      helper: "The record is strong enough to endorse for archive release.",
    };
  }

  if (averageGrade !== null && averageGrade >= 85) {
    return {
      label: "Review Ready",
      tone: "bg-primary/10 text-primary",
      helper: "The record can move forward after a final staff quality check.",
    };
  }

  return {
    label: "Needs Revision",
    tone: "bg-warning/10 text-warning",
    helper: "The grade pattern suggests clarification or manuscript revisions.",
  };
}

export const FinalApprovalsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: approvals, isLoading, refetch } = usePendingFinalApprovals();
  const updateApproval = useUpdateFinalApproval();
  const [search, setSearch] = useState("");
  const [reviewingApprovalId, setReviewingApprovalId] = useState<string | null>(null);
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

  const reviewTarget = (approvals || []).find((approval: any) => approval.id === reviewingApprovalId) || null;
  const archiveReadyCount = (approvals || []).filter((approval: any) => getRecommendation(approval).label === "Archive Ready").length;
  const needsReviewCount = (approvals || []).filter((approval: any) => getRecommendation(approval).label !== "Archive Ready").length;

  async function handleAction(researchId: string, status: "approved" | "rejected" | "revision_requested") {
    if (!researchId) return;

    if (status !== "approved" && !(remarks[researchId] || "").trim()) {
      show("Add staff remarks before requesting revision or rejecting a record.", "error");
      return;
    }

    try {
      await updateApproval.mutateAsync({
        researchId,
        status,
        remarks: remarks[researchId],
      });

      show(
        `Research ${status === "approved" ? "approved and archived" : status === "revision_requested" ? "sent for revision" : "rejected"}.`,
        "success"
      );
      setRemarks((previous) => ({ ...previous, [researchId]: "" }));
      setReviewingApprovalId(null);
    } catch (error: any) {
      show(error?.message || "Failed to update the final approval record.", "error");
    }
  }

  function appendRemark(researchId: string, message: string) {
    setRemarks((previous) => ({
      ...previous,
      [researchId]: previous[researchId] ? `${previous[researchId].trim()} ${message}` : message,
    }));
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Final Approvals"
        description="Review defended research, inspect grade evidence, and complete the final CRAD decision."
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
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
        stats={[
          <div key="pending" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-foreground">{approvals?.length || 0}</p>
          </div>,
          <div key="ready" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Archive Ready</p>
            <p className="text-lg font-bold text-success">{archiveReadyCount}</p>
          </div>,
          <div key="review" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Needs Review</p>
            <p className="text-lg font-bold text-warning">{needsReviewCount}</p>
          </div>,
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <InfoPanel
          title="Decision Workflow"
          body="Use the review workspace to inspect grades, check archive readiness, and finalize the CRAD disposition with structured remarks."
          icon={<ClipboardList className="h-4 w-4 text-primary" />}
        />
        <InfoPanel
          title="Review Standard"
          body="Archive-ready records should have a completed defense, panel grades, and clear staff remarks when revisions or rejection are needed."
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Research</th>
                <th className="px-4 py-3 text-left font-semibold">Members</th>
                <th className="px-4 py-3 text-left font-semibold">Grades</th>
                <th className="px-4 py-3 text-left font-semibold">Average</th>
                <th className="px-4 py-3 text-left font-semibold">Recommendation</th>
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
                  const averageGrade = getApprovalAverage(approval);
                  const recommendation = getRecommendation(approval);

                  return (
                    <tr key={approval.id} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{approval.research?.title}</p>
                        <p className="text-xs font-mono text-muted-foreground">{approval.research?.research_code}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{approval.research?.research_members?.length || 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">{grades.length} submitted</td>
                      <td className="px-4 py-3 text-muted-foreground">{averageGrade !== null ? averageGrade.toFixed(1) : "N/A"}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${recommendation.tone}`}>
                            {recommendation.label}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">{recommendation.helper}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => setReviewingApprovalId(approval.id)} className="gap-1.5">
                          <Eye size={13} />
                          Review Workspace
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewingApprovalId(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Final Approval Workspace</DialogTitle>
            <DialogDescription>
              Inspect defense evidence and complete the final CRAD decision for {reviewTarget?.research?.research_code || "this research record"}.
            </DialogDescription>
          </DialogHeader>
          {reviewTarget ? (
            <FinalApprovalDetails
              approval={reviewTarget}
              remarks={remarks[reviewTarget.research?.id] || ""}
              loading={updateApproval.isPending}
              onRemarksChange={(value) =>
                setRemarks((previous) => ({
                  ...previous,
                  [reviewTarget.research?.id]: value,
                }))
              }
              onUseTemplate={(value) => appendRemark(reviewTarget.research?.id, value)}
              onApprove={() => handleAction(reviewTarget.research?.id, "approved")}
              onRevise={() => handleAction(reviewTarget.research?.id, "revision_requested")}
              onReject={() => handleAction(reviewTarget.research?.id, "rejected")}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FinalApprovalDetails: React.FC<{
  approval: any;
  remarks: string;
  loading: boolean;
  onRemarksChange: (value: string) => void;
  onUseTemplate: (value: string) => void;
  onApprove: () => void;
  onRevise: () => void;
  onReject: () => void;
}> = ({ approval, remarks, loading, onRemarksChange, onUseTemplate, onApprove, onRevise, onReject }) => {
  const grades = approval.defense_grades || [];
  const averageGrade = getApprovalAverage(approval);
  const recommendation = getRecommendation(approval);
  const completedDefense = (approval.research?.defense_schedules || []).some((defense: any) => defense.status === "completed");
  const readinessChecks = [
    {
      label: "Completed defense recorded",
      passed: completedDefense,
    },
    {
      label: "At least one panel grade submitted",
      passed: grades.length > 0,
    },
    {
      label: "Average score above 85",
      passed: averageGrade !== null && averageGrade >= 85,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision Recommendation</p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${recommendation.tone}`}>
                {recommendation.label}
              </span>
              <span className="text-sm text-muted-foreground">{recommendation.helper}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="Members" value={`${approval.research?.research_members?.length || 0}`} icon={<Users size={13} />} />
            <MetricCard label="Grades" value={`${grades.length}`} icon={<Award size={13} />} />
            <MetricCard label="Average" value={averageGrade !== null ? `${averageGrade.toFixed(1)} / 100` : "Not available"} icon={<CheckCircle2 size={13} />} />
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archive Readiness Checklist</p>
            <div className="mt-3 space-y-2">
              {readinessChecks.map((check) => (
                <div key={check.label} className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
                  <span className="text-sm text-foreground">{check.label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${check.passed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {check.passed ? "Ready" : "Needs Action"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
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
              <div className="grid gap-2 md:grid-cols-2">
                {grades.map((grade: any) => (
                  <div key={grade.id} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">{grade.profiles?.full_name}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{Number(grade.grade).toFixed(1)} / 100</p>
                    {grade.remarks ? <p className="mt-1 text-xs italic text-muted-foreground">{grade.remarks}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-4 text-sm text-warning">
                No defense grades have been submitted yet for this research record.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Staff Remarks</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REMARK_TEMPLATES.map((template) => (
                <button
                  key={template}
                  onClick={() => onUseTemplate(template)}
                  className="rounded-full border border-border bg-muted/20 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {template.length > 34 ? `${template.slice(0, 34)}...` : template}
                </button>
              ))}
            </div>
            <textarea
              value={remarks}
              onChange={(event) => onRemarksChange(event.target.value)}
              placeholder="Add the official CRAD final approval remarks here..."
              className="h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onApprove} disabled={loading} className="gap-2">
          <CheckCircle2 size={15} />
          Approve and Archive
        </Button>
        <Button onClick={onRevise} disabled={loading} variant="outline" className="gap-2 text-warning">
          <AlertCircle size={15} />
          Request Revision
        </Button>
        <Button onClick={onReject} disabled={loading} variant="outline" className="gap-2 text-destructive">
          <XCircle size={15} />
          Reject
        </Button>
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

const InfoPanel = ({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
  </div>
);
