import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useRemarks, useCreateRemark, useResearchByAdviser } from "@/shared/hooks/useSupabaseData";
import { formatDistanceToNow } from "date-fns";

export const RemarksPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research } = useResearchByAdviser();
  const { data: remarks, isLoading } = useRemarks();
  const createRemark = useCreateRemark();
  const [researchId, setResearchId] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!researchId || !message.trim()) { show("Select research and write feedback", "error"); return; }
    try {
      await createRemark.mutateAsync({ researchId, message });
      show("Remark sent!", "success");
      setMessage("");
    } catch (err: any) { show(err.message, "error"); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MessageSquare size={20} className="text-primary" /> Remarks & Feedback</h1>
        <p className="text-sm text-muted-foreground">View and add feedback for your advisees</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Add New Remark</h2>
        <select value={researchId} onChange={(e) => setResearchId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
          <option value="">Select research</option>
          {research?.map((r: any) => <option key={r.id} value={r.id}>{r.profiles?.full_name} - {r.research_code}</option>)}
        </select>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your feedback..." rows={3} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none" />
        <button onClick={handleSubmit} disabled={createRemark.isPending} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
          {createRemark.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Send size={14} /> Send Remark</>}
        </button>
      </div>
      {isLoading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div> : (
        <div className="space-y-3">
          {remarks?.map((r: any) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-mono">{r.research?.research_code} · {r.profiles?.full_name}</p>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-foreground">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
