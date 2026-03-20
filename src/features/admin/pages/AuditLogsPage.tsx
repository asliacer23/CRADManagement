import React, { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { useAuditLogs } from "@/shared/hooks/useSupabaseData";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actions = Array.from(new Set((logs || []).map((log: any) => log.action).filter(Boolean)));

  const filteredLogs = useMemo(
    () =>
      (logs || []).filter((log: any) => {
        const target = `${log.action || ""} ${log.details || ""} ${log.profiles?.email || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesAction = !actionFilter || log.action === actionFilter;
        return matchesSearch && matchesAction;
      }),
    [actionFilter, logs, search]
  );

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-14 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Audit Logs"
        description={`System activity and security events (${logs?.length || 0} entries).`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actions, details, or actor..."
        filters={[
          {
            key: "action",
            label: "Action",
            value: actionFilter,
            onChange: setActionFilter,
            options: [{ label: "All", value: "" }, ...actions.map((action) => ({ label: action, value: action }))],
          },
        ]}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Actor</th>
                <th className="px-4 py-3 text-left font-semibold">Summary</th>
                <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredLogs.length ? (
                <EmptyTableState colSpan={5} title="No audit logs yet" description="System activity and security events will appear in this table." />
              ) : (
                filteredLogs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.profiles?.email || "System"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.details || log.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm")}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Eye size={13} />
                          {expandedId === log.id ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id ? (
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Event Details</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{log.details || "No additional details were captured for this event."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
