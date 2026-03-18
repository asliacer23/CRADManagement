import React, { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAllResearch, useCreateDefense } from "@/shared/hooks/useSupabaseData";

export const ManageDefensePage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research, isLoading } = useAllResearch();
  const createDefense = useCreateDefense();
  const [researchId, setResearchId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");

  const handleSubmit = async () => {
    if (!researchId || !date || !time || !room) { show("Fill all fields", "error"); return; }
    try {
      await createDefense.mutateAsync({ researchId, date, time, room });
      show("Defense schedule set!", "success");
      setResearchId(""); setDate(""); setTime(""); setRoom("");
    } catch (err: any) { show(err.message, "error"); }
  };

  const approved = research?.filter((r: any) => r.status === "approved") || [];

  if (isLoading) {
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
        <p className="text-sm text-muted-foreground">Set and update defense schedules</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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
          {createDefense.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Plus size={16} /> Set Schedule</>}
        </button>
      </div>
    </div>
  );
};
