import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Users, Award, MessageSquare } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const PanelApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [defenses, setDefenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [panelDecisions, setPanelDecisions] = useState<Record<string, "approved" | "rejected" | null>>({});
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchMyDefenses = async () => {
      if (!user?.id) return;

      try {
        // Find ALL defenses where I am a panelist (leader or not)
        const { data: panelData, error: panelErr } = await supabase
          .from("defense_panel_members")
          .select("defense_id, role")
          .eq("panelist_id", user.id);

        if (panelErr) throw panelErr;

        if (!panelData?.length) {
          setDefenses([]);
          setLoading(false);
          return;
        }

        // Store user roles for each defense
        const rolesMap: Record<string, string> = {};
        panelData.forEach((p: any) => {
          rolesMap[p.defense_id] = p.role;
        });
        setUserRoles(rolesMap);

        const defenseIds = panelData.map((p: any) => p.defense_id);

        // Fetch defense details with research and grades
        const { data: defensesData, error: defensesErr } = await supabase
          .from("defense_schedules")
          .select("*, research(id, title, research_code, submitted_by, research_members(member_name, is_leader), profiles!research(full_name))")
          .in("id", defenseIds)
          .eq("status", "completed");

        if (defensesErr) throw defensesErr;

        // Fetch grades for each defense
        const enriched = await Promise.all(
          (defensesData || []).map(async (defense: any) => {
            const { data: grades, error: gradesErr } = await supabase
              .from("defense_grades")
              .select("*, profiles!panelist_id(full_name)")
              .eq("defense_id", defense.id);

            if (gradesErr) {
              console.error("Error fetching grades:", gradesErr);
              return { ...defense, grades: [] };
            }

            return { ...defense, grades: grades || [] };
          })
        );

        setDefenses(enriched);
      } catch (err) {
        console.error("Error fetching defenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDefenses();
  }, [user?.id]);

  const handleSubmitDecision = async (defenseId: string, decision: "approved" | "rejected") => {
    try {
      setSubmitting(true);

      // Update defense_schedules notes with panel decision and remarks
      const noteContent = `Panel Leader Decision: ${decision.toUpperCase()}\nRemarks: ${remarks[defenseId] || "No remarks provided"}\nDecision Date: ${new Date().toISOString()}`;

      const { error } = await supabase
        .from("defense_schedules")
        .update({ notes: noteContent })
        .eq("id", defenseId);

      if (error) throw error;

      setPanelDecisions(prev => ({
        ...prev,
        [defenseId]: decision
      }));

      setExpandedId(null);
      setRemarks(prev => ({ ...prev, [defenseId]: "" }));
    } catch (err: any) {
      console.error("Error submitting decision:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 skeleton-shimmer rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 size={20} className="text-primary" /> Panel Approvals
        </h1>
        <p className="text-sm text-muted-foreground">View panel grades and decisions</p>
      </div>

      {!defenses.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No completed defenses</p>
          <p className="text-xs text-muted-foreground mt-1">You will see completed defenses where you are assigned as a panelist.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {defenses.map((defense: any) => {
            const avgGrade = defense.grades.length > 0
              ? defense.grades.reduce((sum: number, g: any) => sum + Number(g.grade), 0) / defense.grades.length
              : null;
            const allGradesSubmitted = defense.defense_panel_members?.length > 0 && 
              defense.grades.length === defense.defense_panel_members.length;

            return (
              <div
                key={defense.id}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedId(expandedId === defense.id ? null : defense.id)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{defense.research?.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{defense.research?.research_code}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {defense.research?.research_members?.slice(0, 2).map((member: any, idx: number) => (
                          <span key={idx} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            {member.member_name}
                            {member.is_leader && " (Leader)"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <StatusBadge variant={panelDecisions[defense.id] === "approved" ? "active" : panelDecisions[defense.id] === "rejected" ? "rejected" : "pending"}>
                      {panelDecisions[defense.id] ? panelDecisions[defense.id] : "Pending"}
                    </StatusBadge>
                  </div>
                </button>

                {expandedId === defense.id && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/20 animate-slide-down">
                    {/* Grades Display */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Award size={12} /> Panelist Grades ({defense.grades.length})
                      </p>
                      {defense.grades.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No grades submitted yet</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {defense.grades.map((grade: any, idx: number) => (
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
                          {avgGrade !== null && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mt-2">
                              <p className="text-xs text-primary font-semibold">Panel Average</p>
                              <p className="text-lg font-bold text-primary">{avgGrade.toFixed(1)} / 100</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Panel Remarks - Only for Leader */}
                    {userRoles[defense.id] === "leader" && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          <MessageSquare size={12} className="inline mr-1" /> Panel Decision Remarks
                        </label>
                        <textarea
                          value={remarks[defense.id] || ""}
                          onChange={(e) => setRemarks(prev => ({ ...prev, [defense.id]: e.target.value }))}
                          placeholder="Provide your panel's decision reasoning and any relevant remarks..."
                          className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none"
                        />
                      </div>
                    )}

                    {/* Action Buttons - Only for Leader */}
                    {userRoles[defense.id] === "leader" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitDecision(defense.id, "approved")}
                          disabled={submitting || defense.grades.length === 0}
                          className="flex-1 h-10 rounded-lg bg-success/10 text-success font-semibold text-sm hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {submitting ? (
                            <div className="h-3 w-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Panel Approves
                        </button>
                        <button
                          onClick={() => handleSubmitDecision(defense.id, "rejected")}
                          disabled={submitting || defense.grades.length === 0}
                          className="flex-1 h-10 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {submitting ? (
                            <div className="h-3 w-3 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Panel Rejects
                        </button>
                      </div>
                    ) : (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-2">
                          <CheckCircle2 size={14} /> Waiting for panel leader decision
                        </p>
                        <p className="text-xs text-blue-600/70 mt-1">The panel leader will review all grades and make the final panel decision.</p>
                      </div>
                    )}

                    {defense.grades.length === 0 && userRoles[defense.id] === "leader" && (
                      <p className="text-xs text-warning bg-warning/10 px-2 py-1.5 rounded border border-warning/20 flex items-center gap-1">
                        <AlertCircle size={12} /> All panelists must submit grades before you can make a decision
                      </p>
                    )}
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
