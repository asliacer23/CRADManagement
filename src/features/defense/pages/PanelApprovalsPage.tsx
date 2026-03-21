import React, { useMemo, useState } from "react";
import { AlertCircle, Award, CheckCircle2, Eye, MessageSquare, Users, XCircle } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function getBypassPanelApprovals(userId: string) {
  const rows = [
    {
      id: "45000000-0000-0000-0000-000000000202",
      defense_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      defense_time: "13:00",
      room: "Research Hall A",
      status: "completed",
      research: {
        id: "40000000-0000-0000-0000-000000000203",
        title: "AI-Powered Attendance Analytics for Student Intervention",
        research_code: "R-2026-203",
        submitted_by: "d50e8400-e29b-41d4-a716-446655440005",
        profiles: { full_name: "Ana Reyes" },
        research_members: [
          { member_name: "Ana Reyes", is_leader: true },
          { member_name: "Paolo Ramos", is_leader: false },
        ],
      },
      defense_panel_members: [
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440003", role: "leader", profiles: { full_name: "Prof. Maria Santos" } },
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440001", role: "panelist", profiles: { full_name: "CRAD Admin" } },
      ],
      grades: [
        { id: "55000000-0000-0000-0000-000000000201", grade: 95.5, remarks: "Strong methodology and complete documentation.", profiles: { full_name: "Prof. Maria Santos" } },
        { id: "55000000-0000-0000-0000-000000000202", grade: 93, remarks: "Approved with minor formatting refinements.", profiles: { full_name: "CRAD Admin" } },
      ],
    },
    {
      id: "45000000-0000-0000-0000-000000000203",
      defense_date: new Date(Date.now() - 15 * 86400000).toISOString(),
      defense_time: "10:30",
      room: "Research Hall B",
      status: "completed",
      research: {
        id: "40000000-0000-0000-0000-000000000204",
        title: "Community Research Repository and Archival Dashboard",
        research_code: "R-2026-204",
        submitted_by: "d50e8400-e29b-41d4-a716-446655440005",
        profiles: { full_name: "Ana Reyes" },
        research_members: [{ member_name: "Ana Reyes", is_leader: true }],
      },
      defense_panel_members: [{ panelist_id: "d50e8400-e29b-41d4-a716-446655440003", role: "leader", profiles: { full_name: "Prof. Maria Santos" } }],
      grades: [{ id: "55000000-0000-0000-0000-000000000203", grade: 96, remarks: "Ready for final acceptance.", profiles: { full_name: "Prof. Maria Santos" } }],
    },
  ];

  return rows.filter((row) => row.defense_panel_members.some((member) => member.panelist_id === userId));
}

export const PanelApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const crad = supabase.schema("crad") as any;
  const [defenses, setDefenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [panelDecisions, setPanelDecisions] = useState<Record<string, "approved" | "rejected" | null>>({});
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");

  React.useEffect(() => {
    const fetchMyDefenses = async () => {
      if (!user?.id) {
        setDefenses([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/panel-approvals?panelistId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}`
        );
        const payload = await response.json();

        if (response.ok && payload?.ok && Array.isArray(payload.data)) {
          const dbDefenses = payload.data;
          const rolesMap: Record<string, string> = {};
          dbDefenses.forEach((defense: any) => {
            const role =
              defense.my_role ||
              defense.defense_panel_members.find((member: any) => member.panelist_id === user.id)?.role ||
              (user.role === "admin" ? "admin" : "");
            if (role) rolesMap[defense.id] = role;
          });
          setUserRoles(rolesMap);
          setDefenses(dbDefenses);
          setLoading(false);
          return;
        }

        if (user.isBypass) {
          const bypassDefenses = getBypassPanelApprovals(user.id);
          const rolesMap: Record<string, string> = {};
          bypassDefenses.forEach((defense) => {
            const myPanel = defense.defense_panel_members.find((member) => member.panelist_id === user.id);
            if (myPanel) rolesMap[defense.id] = myPanel.role;
          });
          setUserRoles(rolesMap);
          setDefenses(bypassDefenses);
          setLoading(false);
          return;
        }

        const { data: panelData, error: panelErr } = await supabase
          .schema("crad")
          .from("defense_panel_members")
          .select("defense_id, role")
          .eq("panelist_id", user.id);

        if (panelErr) throw panelErr;

        if (!panelData?.length) {
          setDefenses([]);
          setLoading(false);
          return;
        }

        const rolesMap: Record<string, string> = {};
        panelData.forEach((panel: any) => {
          rolesMap[panel.defense_id] = panel.role;
        });
        setUserRoles(rolesMap);

        const defenseIds = panelData.map((panel: any) => panel.defense_id);

        const { data: defensesData, error: defensesErr } = await supabase
          .schema("crad")
          .from("defense_schedules")
          .select("*")
          .in("id", defenseIds)
          .eq("status", "completed");

        if (defensesErr) throw defensesErr;

        if (!defensesData?.length) {
          setDefenses([]);
          setLoading(false);
          return;
        }

        const researchIds = Array.from(new Set((defensesData || []).map((defense: any) => defense.research_id).filter(Boolean)));

        const [{ data: researchData, error: researchErr }, { data: panelMembersData, error: panelMembersErr }] = await Promise.all([
          crad
            .from("research")
            .select("id, title, research_code, submitted_by, research_members(member_name, is_leader), profiles!submitted_by(full_name)")
            .in("id", researchIds),
          crad
            .from("defense_panel_members")
            .select("defense_id, panelist_id, role, profiles!panelist_id(full_name)")
            .in("defense_id", defenseIds),
        ]);

        if (researchErr) throw researchErr;
        if (panelMembersErr) throw panelMembersErr;

        const researchById = new Map((researchData || []).map((research: any) => [research.id, research]));
        const panelMembersByDefenseId = new Map<string, any[]>();
        (panelMembersData || []).forEach((member: any) => {
          const list = panelMembersByDefenseId.get(member.defense_id) || [];
          list.push(member);
          panelMembersByDefenseId.set(member.defense_id, list);
        });

        const enriched = await Promise.all(
          (defensesData || []).map(async (defense: any) => {
            const { data: grades, error: gradesErr } = await supabase
              .schema("crad")
              .from("defense_grades")
              .select("*, profiles!panelist_id(full_name)")
              .eq("defense_id", defense.id);

            if (gradesErr) {
              console.error("Error fetching grades:", gradesErr);
              return {
                ...defense,
                defense_panel_members: panelMembersByDefenseId.get(defense.id) || [],
                research: researchById.get(defense.research_id) || null,
                grades: [],
              };
            }

            return {
              ...defense,
              defense_panel_members: panelMembersByDefenseId.get(defense.id) || [],
              research: researchById.get(defense.research_id) || null,
              grades: grades || [],
            };
          })
        );

        setDefenses(enriched);
      } catch (error) {
        console.error("Error fetching defenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDefenses();
  }, [user?.id]);

  const filteredDefenses = useMemo(
    () =>
      defenses.filter((defense: any) => {
        const computedDecision = panelDecisions[defense.id] || "";
        const target = `${defense.research?.title || ""} ${defense.research?.research_code || ""} ${defense.room || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesDecision = !decisionFilter || computedDecision === decisionFilter;
        return matchesSearch && matchesDecision;
      }),
    [decisionFilter, defenses, panelDecisions, search]
  );

  const stats = [
    { label: "Completed", value: defenses.length },
    { label: "Approved", value: Object.values(panelDecisions).filter((value) => value === "approved").length },
    { label: "Rejected", value: Object.values(panelDecisions).filter((value) => value === "rejected").length },
  ];

  const handleSubmitDecision = async (defenseId: string, decision: "approved" | "rejected") => {
    try {
      setSubmitting(true);

      const noteContent = `Panel Leader Decision: ${decision.toUpperCase()}\nRemarks: ${remarks[defenseId] || "No remarks provided"}\nDecision Date: ${new Date().toISOString()}`;

      const { error } = await supabase
        .schema("crad")
        .from("defense_schedules")
        .update({ notes: noteContent })
        .eq("id", defenseId);

      if (error) throw error;

      setPanelDecisions((previous) => ({
        ...previous,
        [defenseId]: decision,
      }));

      setExpandedId(null);
      setRemarks((previous) => ({ ...previous, [defenseId]: "" }));
    } catch (error: any) {
      console.error("Error submitting decision:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Panel Approvals"
        description="Review completed defenses, inspect grades, and capture the panel decision."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, code, or room..."
        filters={[
          {
            key: "decision",
            label: "Decision",
            value: decisionFilter,
            onChange: setDecisionFilter,
            options: [
              { label: "All", value: "" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ],
          },
        ]}
        stats={stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Research</th>
                <th className="px-4 py-3 text-left font-semibold">Leader</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Grades</th>
                <th className="px-4 py-3 text-left font-semibold">My Role</th>
                <th className="px-4 py-3 text-left font-semibold">Decision</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredDefenses.length ? (
                <EmptyTableState
                  colSpan={7}
                  title="No completed defenses"
                  description="You will see completed defenses here when you are assigned as a panelist."
                />
              ) : (
                filteredDefenses.map((defense: any) => {
                  const averageGrade =
                    defense.grades.length > 0
                      ? defense.grades.reduce((sum: number, grade: any) => sum + Number(grade.grade), 0) / defense.grades.length
                      : null;
                  const decision = panelDecisions[defense.id];

                  return (
                    <React.Fragment key={defense.id}>
                      <tr className="border-t border-border/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{defense.research?.title}</p>
                          <p className="text-xs font-mono text-muted-foreground">{defense.research?.research_code}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {defense.research?.profiles?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(defense.defense_date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {defense.grades.length}
                          {averageGrade !== null ? ` submitted / avg ${averageGrade.toFixed(1)}` : " submitted"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium capitalize text-foreground">
                            {userRoles[defense.id] || "panelist"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={decision === "approved" ? "active" : decision === "rejected" ? "rejected" : "pending"}>
                            {decision || "Pending"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === defense.id ? null : defense.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Eye size={13} />
                            {expandedId === defense.id ? "Hide" : "Review"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === defense.id && (
                        <tr className="border-t border-border/40 bg-muted/20">
                          <td colSpan={7} className="px-4 py-4">
                            <PanelApprovalDetails
                              defense={defense}
                              remarks={remarks[defense.id] || ""}
                              role={userRoles[defense.id]}
                              decision={decision}
                              submitting={submitting}
                              onRemarksChange={(value) => setRemarks((previous) => ({ ...previous, [defense.id]: value }))}
                              onApprove={() => handleSubmitDecision(defense.id, "approved")}
                              onReject={() => handleSubmitDecision(defense.id, "rejected")}
                            />
                          </td>
                        </tr>
                      )}
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

const PanelApprovalDetails: React.FC<{
  defense: any;
  role?: string;
  remarks: string;
  decision: "approved" | "rejected" | null | undefined;
  submitting: boolean;
  onRemarksChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({ defense, role, remarks, decision, submitting, onRemarksChange, onApprove, onReject }) => {
  const averageGrade =
    defense.grades.length > 0
      ? defense.grades.reduce((sum: number, grade: any) => sum + Number(grade.grade), 0) / defense.grades.length
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <DetailCard label="Panelists" value={`${defense.defense_panel_members?.length || 0}`} icon={<Users size={13} />} />
        <DetailCard label="Grades Submitted" value={`${defense.grades.length}`} icon={<Award size={13} />} />
        <DetailCard label="Average Grade" value={averageGrade !== null ? `${averageGrade.toFixed(1)} / 100` : "Not available"} icon={<CheckCircle2 size={13} />} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panelist Grades</p>
        {!defense.grades.length ? (
          <p className="text-xs italic text-muted-foreground">No grades submitted yet.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {defense.grades.map((grade: any) => (
              <div key={grade.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{grade.profiles?.full_name}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{Number(grade.grade).toFixed(1)} / 100</p>
                {grade.remarks ? <p className="mt-1 text-xs italic text-muted-foreground">{grade.remarks}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {role === "leader" ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare size={12} className="mr-1 inline" />
              Panel Remarks
            </p>
            <textarea
              value={remarks}
              onChange={(event) => onRemarksChange(event.target.value)}
              placeholder="Summarize the panel decision and next steps..."
              className="h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onApprove}
              disabled={submitting || defense.grades.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-success/10 px-4 text-sm font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={submitting || defense.grades.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              <XCircle size={15} />
              Reject
            </button>
            {decision ? (
              <span className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-xs font-medium text-muted-foreground">
                Latest decision: {decision}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          The panel leader will record the final panel decision after reviewing all grades.
        </div>
      )}

      {defense.grades.length === 0 && role === "leader" ? (
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertCircle size={14} />
          All panelists must submit their grades before the leader can finalize a decision.
        </div>
      ) : null}
    </div>
  );
};

const DetailCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-background px-3 py-3">
    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
  </div>
);
