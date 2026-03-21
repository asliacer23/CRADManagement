import React, { useEffect, useMemo, useState } from "react";
import { Award, Building2, CalendarDays, CheckCircle2, Copy, Eye, User } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useArchivedResearch } from "@/shared/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { Button } from "@/components/ui/button";

export const ArchivePage: React.FC = () => {
  const db = supabase as any;
  const { show } = useSnackbar();
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

        const { data: grades, error: gradesErr } = await db
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
  const archiveAverage = useMemo(() => {
    const gradeAverages = Object.values(approvalData)
      .map((entry: any) => {
        const grades = entry?.grades || [];
        if (!grades.length) return null;
        return grades.reduce((sum: number, grade: any) => sum + Number(grade.grade), 0) / grades.length;
      })
      .filter((value): value is number => value !== null);

    if (!gradeAverages.length) return null;
    return gradeAverages.reduce((sum, value) => sum + value, 0) / gradeAverages.length;
  }, [approvalData]);
  const departmentCount = Array.from(new Set((archived || []).map((research: any) => research.departments?.code).filter(Boolean))).length;

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
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Records</p>
            <p className="text-lg font-bold text-foreground">{archived?.length || 0}</p>
          </div>,
          <div key="departments" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Departments</p>
            <p className="text-lg font-bold text-foreground">{departmentCount}</p>
          </div>,
          <div key="average" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg. Defense Grade</p>
            <p className="text-lg font-bold text-foreground">{archiveAverage !== null ? archiveAverage.toFixed(1) : "N/A"}</p>
          </div>,
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <ArchiveSummaryCard title="Repository Scope" value={`${archived?.length || 0} records`} note="Completed and archived research records tracked by CRAD." icon={<CheckCircle2 className="h-4 w-4 text-primary" />} />
        <ArchiveSummaryCard title="Department Coverage" value={`${departmentCount || 0} active groups`} note="Research represented across archived and completed records." icon={<Building2 className="h-4 w-4 text-primary" />} />
        <ArchiveSummaryCard title="Quality Snapshot" value={archiveAverage !== null ? `${archiveAverage.toFixed(1)} / 100` : "Pending"} note="Average defense score based on archived grade evidence already loaded." icon={<Award className="h-4 w-4 text-primary" />} />
      </div>

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
                          <ArchiveDetails
                            research={research}
                            data={approvalData[research.id]}
                            onCopySummary={async () => {
                              const gradeRows = approvalData[research.id]?.grades || [];
                              const approval = approvalData[research.id]?.approval;
                              const average =
                                gradeRows.length > 0
                                  ? gradeRows.reduce((sum: number, grade: any) => sum + Number(grade.grade), 0) / gradeRows.length
                                  : null;
                              const summary = [
                                `Research: ${research.title}`,
                                `Code: ${research.research_code || "N/A"}`,
                                `Leader: ${research.profiles?.full_name || "Unknown"}`,
                                `Department: ${research.departments?.name || "Not set"}`,
                                `Archive Status: ${research.status}`,
                                `Defense Average: ${average !== null ? `${average.toFixed(1)} / 100` : "Not available"}`,
                                `Approval Status: ${approval?.status || "Not recorded"}`,
                                `Approval Remarks: ${approval?.remarks || "No approval remarks recorded"}`,
                              ].join("\n");

                              try {
                                await navigator.clipboard.writeText(summary);
                                show("Archive summary copied.", "success");
                              } catch {
                                show("Unable to copy archive summary.", "error");
                              }
                            }}
                          />
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

const ArchiveDetails: React.FC<{ research: any; data?: { approval?: any; grades?: any[] }; onCopySummary: () => void }> = ({ research, data, onCopySummary }) => {
  const approval = data?.approval;
  const grades = data?.grades || [];
  const averageGrade =
    grades.length > 0 ? grades.reduce((sum, grade) => sum + Number(grade.grade), 0) / grades.length : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archive Record Sheet</p>
            <Button variant="outline" size="sm" onClick={onCopySummary} className="gap-1.5">
              <Copy size={13} />
              Copy Brief
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            <InfoLine label="Research Code" value={research.research_code || "Not recorded"} />
            <InfoLine label="Leader" value={research.profiles?.full_name || "Unknown"} icon={<User size={12} />} />
            <InfoLine label="Department" value={research.departments?.name || "Not set"} icon={<Building2 size={12} />} />
            <InfoLine label="Archived On" value={format(new Date(research.updated_at || research.created_at), "MMM d, yyyy")} icon={<CalendarDays size={12} />} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research Abstract Snapshot</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {research.abstract || "No abstract was stored for this archive record."}
          </p>
        </div>
      </div>

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

const ArchiveSummaryCard = ({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      </div>
      {icon}
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{note}</p>
  </div>
);
