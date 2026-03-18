import React, { useState } from "react";
import { ShieldCheck, Search } from "lucide-react";
import { useAuditLogs } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const filtered = logs?.filter((l: any) => (l.action + (l.details || "")).toLowerCase().includes(search.toLowerCase())) || [];

  if (isLoading) return <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> Audit Logs</h1>
          <p className="text-sm text-muted-foreground">System activity and security logs ({logs?.length || 0} entries)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-32" />
        </div>
      </div>
      {!filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ShieldCheck size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No audit logs yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[44px]">
              <span className="text-[10px] font-mono font-bold bg-muted px-2 py-1 rounded text-muted-foreground text-center flex-shrink-0">{l.action}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{l.details || l.action}</p>
                <p className="text-xs text-muted-foreground">{l.profiles?.email || "System"}</p>
              </div>
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap hidden sm:block">{format(new Date(l.created_at), "yyyy-MM-dd HH:mm")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
