import React, { useState } from "react";
import { Users, Shield, Mail, Calendar, PencilLine } from "lucide-react";
import { format } from "date-fns";
import { useAllUsers, useUpdateUserRole } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

const ROLES = ["student", "adviser", "staff", "admin"] as const;

const roleBadgeColors: Record<string, string> = {
  student: "bg-secondary/15 text-secondary",
  adviser: "bg-primary/15 text-primary",
  staff: "bg-warning/15 text-warning",
  admin: "bg-accent/15 text-accent",
};

export const ManageUsersPage: React.FC = () => {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const { show } = useSnackbar();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const filtered = (users || []).filter((u: any) => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.user_roles?.[0]?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      show(`Role updated to ${newRole}`, "success");
      setEditingUser(null);
    } catch (err: any) {
      show(err.message || "Failed to update role", "error");
    }
  };

  const roleCounts = (users || []).reduce((acc: Record<string, number>, u: any) => {
    const role = u.user_roles?.[0]?.role || "student";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Manage Users"
        description={`${users?.length || 0} registered users`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name or email..."
        filters={[
          {
            key: "role",
            label: "Role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: "All", value: "" },
              ...ROLES.map((role) => ({ label: role.charAt(0).toUpperCase() + role.slice(1), value: role })),
            ],
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "" : role)}
            className={`bg-card border rounded-xl p-3 text-left transition-all hover:shadow-sm ${roleFilter === role ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium capitalize text-muted-foreground">{role}s</span>
              <Shield size={14} className={roleBadgeColors[role]?.split(" ")[1] || "text-muted-foreground"} />
            </div>
            <p className="text-xl font-bold text-foreground">{roleCounts[role] || 0}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Department</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <EmptyTableState colSpan={6} title="No users found" description="User records that match your filters will appear here." />
                ) : (
                  filtered.map((u: any) => {
                    const currentRole = u.user_roles?.[0]?.role || "student";

                    return (
                      <tr key={u.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-xs font-bold text-primary">{(u.full_name || "?")[0]?.toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{u.full_name || "-"}</p>
                              {u.student_id ? <p className="font-mono text-[10px] text-muted-foreground">{u.student_id}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="flex-shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.department || "-"}</td>
                        <td className="px-4 py-3">
                          {editingUser === u.user_id ? (
                            <select
                              value={currentRole}
                              onChange={(event) => handleRoleChange(u.user_id, event.target.value)}
                              onBlur={() => setEditingUser(null)}
                              autoFocus
                              className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingUser(u.user_id)}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-opacity hover:opacity-80 ${roleBadgeColors[currentRole]}`}
                            >
                              {currentRole}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar size={11} />
                            {format(new Date(u.created_at), "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingUser(editingUser === u.user_id ? null : u.user_id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            <PencilLine size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border sm:hidden">
            {!filtered.length ? (
              <div className="p-8 text-center">
                <Users size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            ) : (
              filtered.map((u: any) => {
                const currentRole = u.user_roles?.[0]?.role || "student";

                return (
                  <div key={u.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-xs font-bold text-primary">{(u.full_name || "?")[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.full_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingUser(editingUser === u.user_id ? null : u.user_id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${roleBadgeColors[currentRole]}`}
                      >
                        {currentRole}
                      </button>
                    </div>
                    {editingUser === u.user_id ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(u.user_id, role)}
                            className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${currentRole === role ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
