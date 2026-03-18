import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";

const schedules = [
  { id: "D-001", research: "R-2024-001", title: "IoT-Based Smart Classroom", date: "Mar 25, 2026", time: "9:00 AM", room: "Room 301", panel: ["Dr. Santos", "Prof. Cruz", "Dr. Reyes"], status: "active" as const },
  { id: "D-002", research: "R-2024-003", title: "Blockchain Credential Verification", date: "Mar 28, 2026", time: "2:00 PM", room: "Room 405", panel: ["Dr. Santos", "Prof. Luna"], status: "pending" as const },
];

export const DefenseSchedulePage: React.FC = () => (
  <div className="space-y-5 animate-fade-in">
    <div>
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Calendar size={20} className="text-primary" /> Defense Schedule
      </h1>
      <p className="text-sm text-muted-foreground">Upcoming thesis defense schedules</p>
    </div>

    <div className="space-y-3">
      {schedules.map((s) => (
        <div key={s.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground font-mono">{s.research}</p>
            </div>
            <StatusBadge variant={s.status}>{s.status}</StatusBadge>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={12} /> {s.date}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {s.time}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {s.room}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Panel:</span>
            {s.panel.map((p) => (
              <span key={p} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
