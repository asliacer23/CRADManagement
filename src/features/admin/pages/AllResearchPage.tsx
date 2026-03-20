import React, { useMemo, useState } from "react";
import { Eye, Users } from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { useAllResearch } from "@/shared/hooks/useSupabaseData";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

const COLORS = [
  "hsl(225, 73%, 30%)",
  "hsl(200, 80%, 55%)",
  "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)",
  "hsl(355, 80%, 45%)",
  "hsl(215, 16%, 47%)",
  "hsl(280, 60%, 50%)",
  "hsl(160, 60%, 40%)",
];

export const AllResearchPage: React.FC = () => {
  const { data: research, isLoading } = useAllResearch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusCounts: Record<string, number> = {};
  (research || []).forEach((item: any) => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  const filteredResearch = useMemo(
    () =>
      (research || []).filter((item: any) => {
        const target = `${item.title || ""} ${item.research_code || ""} ${item.profiles?.full_name || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [research, search, statusFilter]
  );

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const statuses = Object.keys(statusCounts);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="h-7 w-48 rounded skeleton-shimmer" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <TableSkeleton rows={5} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="All Research"
        description={`${research?.length || 0} total submissions across all modules.`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, code, or submitter..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ label: "All", value: "" }, ...statuses.map((status) => ({ label: status, value: status }))],
          },
        ]}
        stats={[
          <div key="research-total" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{research?.length || 0}</p>
          </div>,
          <div key="research-pending" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-foreground">{statusCounts.pending || 0}</p>
          </div>,
        ]}
      />

      {pieData.length ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Research by Status</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={76} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Research</th>
                <th className="px-4 py-3 text-left font-semibold">Submitted By</th>
                <th className="px-4 py-3 text-left font-semibold">Adviser</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredResearch.length ? (
                <EmptyTableState colSpan={7} title="No research found" description="Matching research submissions will appear here." />
              ) : (
                filteredResearch.map((item: any) => {
                  const adviser = item.adviser_assignments?.[0]?.profiles?.full_name || "Unassigned";
                  const submitter = item.profiles?.full_name || "Unknown";

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="border-t border-border/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs font-mono text-muted-foreground">{item.research_code}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{submitter}</td>
                        <td className="px-4 py-3 text-muted-foreground">{adviser}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.departments?.name || "Not set"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(item.created_at), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={item.status}>{item.status}</StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Eye size={13} />
                            {expandedId === item.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === item.id ? (
                        <tr className="border-t border-border/40 bg-muted/20">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="space-y-4 rounded-xl border border-border bg-background p-4">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Group Members</p>
                                <div className="flex flex-wrap gap-2">
                                  {(item.research_members || []).map((member: any, index: number) => (
                                    <span
                                      key={`${member.member_name}-${index}`}
                                      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground"
                                    >
                                      {member.member_name}
                                      {member.is_leader ? " (Leader)" : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <DetailLine label="Members" value={`${item.research_members?.length || 0}`} icon={<Users size={12} />} />
                                <DetailLine label="Adviser" value={adviser} />
                                <DetailLine label="Department" value={item.departments?.name || "Not set"} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DetailLine = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="rounded-lg border border-border px-3 py-3">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon ? <span className="mr-1 inline-flex align-middle">{icon}</span> : null}
      {label}
    </p>
    <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
  </div>
);
