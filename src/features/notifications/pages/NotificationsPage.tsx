import React from "react";
import { Bell, CheckCircle2, AlertCircle, Info, Calendar } from "lucide-react";

const notifications = [
  { id: "1", icon: <CheckCircle2 size={16} className="text-success" />, title: "Research Approved", message: "Your research R-2024-003 has been approved by Dr. Santos", time: "2h ago", read: false },
  { id: "2", icon: <Calendar size={16} className="text-secondary" />, title: "Defense Scheduled", message: "Your defense is scheduled for March 25, 2026 at 9:00 AM, Room 301", time: "5h ago", read: false },
  { id: "3", icon: <Info size={16} className="text-primary" />, title: "Payment Verified", message: "Your payment for R-2024-001 has been verified", time: "1d ago", read: true },
  { id: "4", icon: <AlertCircle size={16} className="text-warning" />, title: "Revision Required", message: "Please revise Chapter 3 of your manuscript per adviser's remarks", time: "2d ago", read: true },
  { id: "5", icon: <Info size={16} className="text-primary" />, title: "System Update", message: "CRAD system will undergo maintenance on March 20, 2026", time: "3d ago", read: true },
];

export const NotificationsPage: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bell size={20} className="text-primary" /> Notifications
        </h1>
        <p className="text-sm text-muted-foreground">Stay updated on your research progress</p>
      </div>
      <button className="text-xs text-primary hover:underline">Mark all read</button>
    </div>

    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
      {notifications.map((n) => (
        <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px] ${!n.read ? "bg-primary/[0.02]" : ""}`}>
          <div className="mt-0.5 flex-shrink-0">{n.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
