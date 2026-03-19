import React, { useState } from "react";
import { Calendar, Plus, CheckCircle2, Clock } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAllResearch, useCreateDefense, useDefenseSchedules, useUpdateDefenseStatus } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";

export const ManageDefensePage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research, isLoading: researchLoading } = useAllResearch();
  const { data: schedules, isLoading: schedulesLoading } = useDefenseSchedules();
  const createDefense = useCreateDefense();
  const updateDefenseStatus = useUpdateDefenseStatus();
  const [researchId, setResearchId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");
  const [completingId, setCompleatingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!researchId || !date || !time || !room) {
      show("Fill all required fields", "error");
      return;
    }
    try {
      await createDefense.mutateAsync({ researchId, date, time, room });
      show("Defense schedule created successfully!", "success");
      setResearchId("");
      setDate("");
      setTime("");
      setRoom("");
    } catch (err: any) {
      show(err.message, "error");
    }
  };

  const handleCompleteDefense = async (defenseId: string) => {
    try {
      setCompleatingId(defenseId);
      await updateDefenseStatus.mutateAsync({ defenseId, status: "completed" });
      show("Defense marked as completed! Panelists can now submit grades.", "success");
    } catch (err: any) {
      show(err.message, "error");
    } finally {
      setCompleatingId(null);
    }
  };

  const approved = research?.filter((r: any) => r.status === "approved") || [];
  const scheduledDefenses = schedules?.filter((s: any) => s.status === "scheduled") || [];
  const completedDefenses = schedules?.filter((s: any) => s.status === "completed") || [];

  if (researchLoading || schedulesLoading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-56 skeleton-shimmer rounded" />
        <div className="h-72 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calendar size={20} className="text-primary" /> Manage Defense Schedule</h1>
        <p className="text-sm text-muted-foreground">Set, manage, and complete defense schedules</p>
      </div>

      {/* Create New Defense Schedule */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus size={16} /> Create New Defense</h2>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Research</label>
          <select value={researchId} onChange={(e) => setResearchId(e.target.value)} disabled={!approved.length} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <option value="">Select research</option>
            {approved.map((r: any) => <option key={r.id} value={r.id}>{r.research_code} - {r.title}</option>)}
          </select>
          {!approved.length && (
            <p className="mt-2 text-xs text-muted-foreground">No approved research is available for scheduling yet.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Room</label>
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g., Room 301" className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
        </div>

        <button onClick={handleSubmit} disabled={createDefense.isPending || !approved.length} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {createDefense.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Plus size={16} /> Create Schedule</>}
        </button>
      </div>

      {/* Scheduled Defenses - Mark as Completed */}
      {scheduledDefenses.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock size={16} /> Scheduled Defenses</h2>
          <div className="space-y-2">
            {scheduledDefenses.map((schedule: any) => (
              <div key={schedule.id} className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-input">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{schedule.research?.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{schedule.research?.research_code}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(schedule.defense_date), "MMM d, yyyy")}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {schedule.defense_time}</span>
                    <span>•</span>
                    <span>{schedule.room}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteDefense(schedule.id)}
                  disabled={updateDefenseStatus.isPending || completingId === schedule.id}
                  className="flex-shrink-0 h-10 px-3 rounded-lg bg-success/10 text-success font-semibold text-sm hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  {updateDefenseStatus.isPending && completingId === schedule.id ? (
                    <div className="h-3 w-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Defenses - Show Status */}
      {completedDefenses.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><CheckCircle2 size={16} /> Completed Defenses</h2>
          <p className="text-xs text-muted-foreground">Panelists can submit grades. Staff can review in Final Approvals.</p>
          <div className="space-y-2">
            {completedDefenses.map((schedule: any) => (
              <div key={schedule.id} className="flex items-start justify-between gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{schedule.research?.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{schedule.research?.research_code}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(schedule.defense_date), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <StatusBadge variant="active">Completed</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!scheduledDefenses.length && !completedDefenses.length && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No defense schedules yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a defense schedule above to get started.</p>
        </div>
      )}
    </div>
  );
};
