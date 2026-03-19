import React, { useState, useEffect } from "react";
import { Archive, Search, Award, CheckCircle2, User } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useArchivedResearch } from "@/shared/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const ArchivePage: React.FC = () => {
  const { data: archived, isLoading } = useArchivedResearch();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalData, setApprovalData] = useState<Record<string, any>>({});

  const filtered = archived?.filter((r: any) => r.title.toLowerCase().includes(search.toLowerCase()) || r.research_code.toLowerCase().includes(search.toLowerCase())) || [];

  // Fetch approval and grade data when expanded
  useEffect(() => {
    if (expandedId && !approvalData[expandedId]) {
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

          setApprovalData(prev => ({
            ...prev,
            [expandedId]: { approval, grades }
          }));
        } catch (err) {
          console.error("Error fetching data:", err);
        }
      };

      fetchApprovalData();
    }
  }, [expandedId, approvalData]);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Archive size={20} className="text-primary" /> Research Archive</h1>
          <p className="text-sm text-muted-foreground">Browse completed and archived research</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search archive..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-40" />
        </div>
      </div>
      {!filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Archive size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No archived research</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => {
            const data = approvalData[r.id];
            const approval = data?.approval;
            const grades = data?.grades || [];
            const avgGrade = grades.length > 0 
              ? grades.reduce((sum: number, g: any) => sum + Number(g.grade), 0) / grades.length 
              : null;

            return (
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[44px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground text-left">{r.title}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-mono">{r.research_code}</span> · {r.profiles?.full_name}</p>
                  </div>
                  <StatusBadge variant={r.status}>{r.status}</StatusBadge>
                  <span className={`transition-transform text-xl ${expandedId === r.id ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {expandedId === r.id && (
                  <div className="border-t border-border p-4 space-y-3 bg-muted/20 animate-slide-down">
                    {/* Group Members */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Group Members</p>
                      <div className="flex flex-wrap gap-1">
                        {r.research_members?.map((member: any, idx: number) => (
                          <span key={idx} className="text-xs bg-background px-2.5 py-1 rounded border border-border text-foreground">
                            {member.member_name}
                            {member.is_leader && <span className="ml-1 text-primary font-semibold">(Leader)</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Defense Grades Section */}
                    {grades && grades.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Award size={12} /> Defense Grades
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {grades.map((grade: any, idx: number) => (
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
                            <p className="text-xs text-primary font-semibold">Average Grade</p>
                            <p className="text-lg font-bold text-primary">{avgGrade.toFixed(1)} / 100</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval Information */}
                    {approval && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Approval Info
                        </p>
                        <div className="bg-background border border-border rounded-lg p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <span className="text-xs font-semibold text-success capitalize">{approval.status}</span>
                          </div>
                          {approval.approved_by_profile && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User size={10} /> Approved By
                              </span>
                              <span className="text-xs font-semibold text-foreground">{approval.approved_by_profile.full_name}</span>
                            </div>
                          )}
                          {approval.approved_at && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Approved Date</span>
                              <span className="text-xs text-foreground">{format(new Date(approval.approved_at), "MMM d, yyyy")}</span>
                            </div>
                          )}
                          {approval.remarks && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-1">Staff Remarks</p>
                              <p className="text-xs text-foreground italic">{approval.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
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
