import React from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { ClipboardCheck, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";

const manuscripts = [
  { id: "M-001", research: "R-2024-005", title: "Smart Parking System Using ESP32", student: "Pedro Garcia", version: "v2.1", submitted: "Mar 14, 2026" },
  { id: "M-002", research: "R-2024-006", title: "Mobile App for Campus Navigation", student: "Anna Lim", version: "v1.0", submitted: "Mar 12, 2026" },
];

export const ReviewManuscriptsPage: React.FC = () => {
  const { show } = useSnackbar();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck size={20} className="text-primary" /> Review Manuscripts
        </h1>
        <p className="text-sm text-muted-foreground">Review and provide feedback on student manuscripts</p>
      </div>

      <div className="space-y-3">
        {manuscripts.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl p-4 space-y-3 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono">{m.id}</span> · {m.student} · {m.version}
                </p>
              </div>
              <StatusBadge variant="review">Under Review</StatusBadge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => show("Manuscript approved!", "success")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors min-h-[44px]"
              >
                <CheckCircle2 size={14} /> Approve
              </button>
              <button
                onClick={() => show("Manuscript returned with remarks", "warning")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors min-h-[44px]"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => show("Opening remarks editor...", "info")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors min-h-[44px]"
              >
                <MessageSquare size={14} /> Add Remarks
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
