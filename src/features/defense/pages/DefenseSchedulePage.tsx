import React, { useState } from "react";
import { Calendar, Clock, MapPin, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useDefenseSchedules, useDefenseGrades, useSubmitDefenseGrade, useUpdateDefenseGrade } from "@/shared/hooks/useSupabaseData";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { format } from "date-fns";

export const DefenseSchedulePage: React.FC = () => {
  const { data: schedules, isLoading } = useDefenseSchedules();
  const { user } = useAuth();
  const { show } = useSnackbar();

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calendar size={20} className="text-primary" /> Defense Schedule</h1>
        <p className="text-sm text-muted-foreground">View schedules and submit grades for completed defenses</p>
      </div>
      {!schedules?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No defense schedules yet</p>
        </div>
      ) : schedules.map((s: any) => (
        <DefenseScheduleCard key={s.id} schedule={s} currentUserId={user?.id} />
      ))}
    </div>
  );
};

const DefenseScheduleCard: React.FC<{ schedule: any; currentUserId?: string }> = ({ schedule, currentUserId }) => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { data: grades, isLoading: gradesLoading } = useDefenseGrades(schedule.research?.id, schedule.id);
  const submitGrade = useSubmitDefenseGrade();
  const updateGrade = useUpdateDefenseGrade();

  const [formData, setFormData] = useState({ grade: 70, remarks: "" });
  
  // Check if current user is a panelist
  const isPanelist = schedule.defense_panel_members?.some((p: any) => p.panelist_id === currentUserId);
  
  // Check if current user is an adviser
  const isAdviser = user?.role === "adviser";
  
  // Check if current user already submitted a grade
  const userGrade = grades?.find((g: any) => g.panelist_id === currentUserId);
  
  // Check if defense is completed
  const isCompleted = schedule.status === "completed";
  
  // Allow submission if user is a panelist or an adviser
  const canSubmitGrade = (isPanelist || isAdviser) && isCompleted;

  const handleSubmitGrade = async () => {
    if (!formData.grade || formData.grade < 0 || formData.grade > 100) {
      show("Grade must be between 0 and 100", "error");
      return;
    }

    try {
      if (userGrade && userGrade.id) {
        await updateGrade.mutateAsync({
          gradeId: userGrade.id,
          grade: Number(formData.grade),
          remarks: formData.remarks,
        });
        show("Grade updated!", "success");
      } else {
        await submitGrade.mutateAsync({
          defenseId: schedule.id,
          researchId: schedule.research?.id,
          grade: Number(formData.grade),
          remarks: formData.remarks,
        });
        show("Grade submitted!", "success");
      }
      setFormData({ grade: 70, remarks: "" });
    } catch (err: any) {
      show(err.message, "error");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{schedule.research?.title}</p>
            <p className="text-xs text-muted-foreground font-mono">{schedule.research?.research_code}</p>
          </div>
          <StatusBadge variant={schedule.status === "scheduled" ? "active" : schedule.status}>{schedule.status}</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(schedule.defense_date), "MMM d, yyyy")}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {schedule.defense_time}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {schedule.room}</span>
        </div>
        {schedule.defense_panel_members?.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Panel:</span>
            {schedule.defense_panel_members.map((p: any) => (
              <span key={p.panelist_id} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.profiles?.full_name}</span>
            ))}
          </div>
        )}
        
        {/* Show indicator if panelist or adviser needs to submit grade */}
        {isCompleted && (isPanelist || isAdviser) && !userGrade && (
          <div className="mt-3 flex items-center gap-2 text-xs text-warning bg-warning/10 px-2 py-1.5 rounded-lg border border-warning/20">
            <AlertCircle size={14} />
            <span>You need to submit a grade for this defense</span>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20 animate-slide-down">
          {/* Submitted Grades Display */}
          {!gradesLoading && grades && grades.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Award size={12} /> Submitted Grades ({grades.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {grades.map((grade, idx) => (
                  <div key={idx} className="bg-background border border-border rounded-lg p-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {grade.profiles?.full_name}
                      {grade.panelist_id === currentUserId && <span className="text-primary font-bold">(You)</span>}
                    </p>
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
            </div>
          )}

          {/* Grade Submission Form - Show for panelists and advisers when completed */}
          {canSubmitGrade && (
            <div className="p-3 bg-background border border-primary/20 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} className="text-primary" /> {userGrade ? "Update Your" : "Submit"} Grade
              </p>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Grade (0-100)</label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-16 h-9 px-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Remarks (Optional)</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Add any remarks about the defense..."
                  className="w-full h-16 px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSubmitGrade}
                disabled={submitGrade.isPending || updateGrade.isPending}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitGrade.isPending || updateGrade.isPending ? (
                  <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {userGrade ? "Update Grade" : "Submit Grade"}
              </button>
            </div>
          )}

          {/* Message for non-panelists or non-completed defenses */}
          {!isCompleted && (
            <p className="text-xs text-muted-foreground italic">Grade submission will be available after defense is completed.</p>
          )}
        </div>
      )}
    </div>
  );
};
