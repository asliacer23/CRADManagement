import React, { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useUnassignedResearch, useAdvisers, useAssignAdviser } from "@/shared/hooks/useSupabaseData";

export const AssignAdviserPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research, isLoading } = useUnassignedResearch();
  const { data: advisers } = useAdvisers();
  const assignMutation = useAssignAdviser();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const handleAssign = async (r: any) => {
    const adviserId = selected[r.id];
    if (!adviserId) { show("Select an adviser", "error"); return; }
    try {
      await assignMutation.mutateAsync({ researchId: r.id, adviserId, title: r.title });
      show("Adviser assigned!", "success");
    } catch (err: any) { show(err.message, "error"); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Users size={20} className="text-primary" /> Assign Adviser</h1>
        <p className="text-sm text-muted-foreground">Assign advisers to student research groups</p>
      </div>
      {!research?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">All research has been assigned</p>
        </div>
      ) : research.map((r: any) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <p className="text-sm font-medium text-foreground">{r.profiles?.full_name}</p>
          <p className="text-xs text-muted-foreground font-mono mb-3">{r.research_code} - {r.title}</p>
          <div className="flex items-center gap-2">
            <select value={selected[r.id] || ""} onChange={(e) => setSelected({ ...selected, [r.id]: e.target.value })} className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
              <option value="">Select adviser</option>
              {advisers?.map((a: any) => <option key={a.user_id} value={a.user_id}>{a.full_name}</option>)}
            </select>
            <button onClick={() => handleAssign(r)} disabled={assignMutation.isPending} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5">
              <UserPlus size={14} /> Assign
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
