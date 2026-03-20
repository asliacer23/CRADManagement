import React, { useEffect, useMemo, useState } from "react";
import { Award, CheckCircle2, Eye, User } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useArchivedResearch } from "@/shared/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

export const ArchivePage: React.FC = () => {
  const { data: archived, isLoading } = useArchivedResearch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalData, setApprovalData] = useState<Record<string, any>>({});

  const filteredArchive = useMemo(
    () =>
      (archived || []).filter((research: any) => {
        const target = `${research.title || ""} ${research.research_code || ""} ${research.profiles?.full_name || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesStatus = !statusFilter || research.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [archived, search, statusFilter]
  );

  useEffect(() => {
    if (!expandedId || approvalData[expandedId]) return;

    const fetchApprovalData = async () => {
      try {
        const { data: approval, error: approvalErr } = await supabase
          .from("final_approvals")
          .select("*, approved_by_profile:profiles!approved_by(full_name)")
          .eq("research_id", expandedId)
          .single();

        if (approvalErr && approvalErr.code !== "PGRST116") {
          console.error("Error fetching approval:", approvalErr);
          return;
        }

        const { data: grades, error: gradesErr } = await supabase
          .from("defense_grades")
          .select("*, profiles!panelist_id(full_name)")
          .eq("research_id", expandedId);

        if (gradesErr) {
          console.error("Error fetching grades:", gradesErr);
          return;
        }

        setApprovalData((previous) => ({
          ...previous,
          [expandedId]: { approval, grades },
        }));
      } catch (error) {
        console.error("Error fetching archive details:", error);
      }
    };

    fetchApprovalData();
  }, [approvalData, expandedId]);

  const statuses = Array.from(new Set((archived || []).map((research: any) => research.status).filter(Boolean)));

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Research Archive"
        description="Completed and archived research with defense and approval history."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, code, or leader..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ label: "All", value: "" }, ...statuses.map((status) => ({ label: status, value: status }))],
          },
        ]}
        stats={[
          <div key="count" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Archived</p>
            <p className="text-lg font-bold text-foreground">{archived?.length || 0}</p>
          </div>,
        ]}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Research</th>
                <th className="px-4 py-3 text-left font-semibold">Leader</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Archived</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredArchive.length ? (
                <EmptyTableState colSpan={6} title="No archived research" description="Completed and archived research will appear here." />
              ) : (
                filteredArchive.map((research: any) => (
                  <React.Fragment key={research.id}>
                    <tr className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{research.title}</p>
                        <p className="text-xs font-mono text-muted-foreground">{research.research_code}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{research.profiles?.full_name || "Unknown"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{research.departments?.name || "Not set"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(research.updated_at || research.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={research.status}>{research.status}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === research.id ? null : research.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Eye size={13} />
                          {expandedId === research.id ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === research.id ? (
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td colSpan={6} className="px-4 py-4">
                          <ArchiveDetails research={research} data={approvalData[research.id]} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ArchiveDetails: React.FC<{ research: any; data?: { approval?: any; grades?: any[] } }> = ({ research, data }) => {
  const approval = data?.approval;
  const grades = data?.grades || [];
  const averageGrade =
    grades.length > 0 ? grades.reduce((sum, grade) => sum + Number(grade.grade), 0) / grades.length : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Group Members</p>
        <div className="flex flex-wrap gap-2">
          {(research.research_members || []).map((member: any, index: number) => (
            <span key={`${member.member_name}-${index}`} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
              {member.member_name}
              {member.is_leader ? " (Leader)" : ""}
            </span>
          ))}
        </div>
      </div>

      {grades.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Award size={12} className="mr-1 inline" />
            Defense Grades
          </p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade: any) => (
              <div key={grade.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{grade.profiles?.full_name}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{Number(grade.grade).toFixed(1)} / 100</p>
                {grade.remarks ? <p className="mt-1 text-xs italic text-muted-foreground">{grade.remarks}</p> : null}
              </div>
            ))}
          </div>
          {averageGrade !== null ? (
            <div className="mt-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3">
              <p className="text-xs font-semibold text-primary">Average Grade</p>
              <p className="text-lg font-bold text-primary">{averageGrade.toFixed(1)} / 100</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {approval ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 size={12} className="mr-1 inline" />
            Approval Summary
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoLine label="Status" value={approval.status} />
            <InfoLine label="Approved By" value={approval.approved_by_profile?.full_name || "System"} icon={<User size={12} />} />
            <InfoLine label="Approved On" value={approval.approved_at ? format(new Date(approval.approved_at), "MMM d, yyyy") : "Not recorded"} />
          </div>
          {approval.remarks ? <p className="mt-3 text-sm italic text-muted-foreground">{approval.remarks}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

const InfoLine = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="rounded-lg border border-border px-3 py-3">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon ? <span className="mr-1 inline-flex align-middle">{icon}</span> : null}
      {label}
    </p>
    <p className="mt-2 text-sm font-medium capitalize text-foreground">{value}</p>
  </div>
);
