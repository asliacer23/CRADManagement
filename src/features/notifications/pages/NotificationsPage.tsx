import React from "react";
import { Bell, CheckCircle2, AlertCircle, Info, Calendar, FileText, CreditCard } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/shared/hooks/useSupabaseData";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, React.ReactNode> = {
  research: <FileText size={16} className="text-primary" />,
  manuscript: <CheckCircle2 size={16} className="text-success" />,
  payment: <CreditCard size={16} className="text-warning" />,
  defense: <Calendar size={16} className="text-secondary" />,
  system: <Info size={16} className="text-primary" />,
  announcement: <AlertCircle size={16} className="text-accent" />,
};

export const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  if (isLoading) return <div className="max-w-2xl mx-auto space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Bell size={20} className="text-primary" /> Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on your research progress</p>
        </div>
        {unreadCount > 0 && <button onClick={() => markAllRead.mutate()} className="text-xs text-primary hover:underline">Mark all read</button>}
      </div>
      {!notifications?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bell size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {notifications.map((n: any) => (
            <div key={n.id} onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer min-h-[44px] ${!n.is_read ? "bg-primary/[0.02]" : ""}`}>
              <div className="mt-0.5 flex-shrink-0">{typeIcons[n.type] || <Info size={16} className="text-primary" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {!n.is_read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
