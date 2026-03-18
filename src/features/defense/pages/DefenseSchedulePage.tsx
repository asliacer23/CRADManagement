import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useDefenseSchedules } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";

export const DefenseSchedulePage: React.FC = () => {
  const { data: schedules, isLoading } = useDefenseSchedules();

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calendar size={20} className="text-primary" /> Defense Schedule</h1>
        <p className="text-sm text-muted-foreground">Upcoming thesis defense schedules</p>
      </div>
      {!schedules?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No defense schedules yet</p>
        </div>
      ) : schedules.map((s: any) => (
        <div key={s.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">{s.research?.title}</p>
              <p className="text-xs text-muted-foreground font-mono">{s.research?.research_code}</p>
            </div>
            <StatusBadge variant={s.status === "scheduled" ? "active" : s.status}>{s.status}</StatusBadge>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(s.defense_date), "MMM d, yyyy")}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {s.defense_time}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {s.room}</span>
          </div>
          {s.defense_panel_members?.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground">Panel:</span>
              {s.defense_panel_members.map((p: any) => (
                <span key={p.panelist_id} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p.profiles?.full_name}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
