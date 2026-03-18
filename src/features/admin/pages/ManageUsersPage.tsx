import React, { useState } from "react";
import { Users, Search, Shield, UserPlus, Mail, Calendar, Building2 } from "lucide-react";
import { useAllUsers, useUpdateUserRole } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { format } from "date-fns";

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

  const filtered = users?.filter((u: any) => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.user_roles?.[0]?.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      show(`Role updated to ${newRole}`, "success");
      setEditingUser(null);
    } catch (err: any) {
      show(err.message || "Failed to update role", "error");
    }
  };

  const roleCounts = users?.reduce((acc: Record<string, number>, u: any) => {
    const role = u.user_roles?.[0]?.role || "student";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Users size={20} className="text-primary" /> Manage Users</h1>
          <p className="text-sm text-muted-foreground">{users?.length || 0} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-40" />
          </div>
        </div>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(role => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? "" : role)}
            className={`bg-card border rounded-xl p-3 text-left transition-all hover:shadow-sm ${roleFilter === role ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground capitalize">{role}s</span>
              <Shield size={14} className={roleBadgeColors[role]?.split(" ")[1] || "text-muted-foreground"} />
            </div>
            <p className="text-xl font-bold text-foreground">{roleCounts[role] || 0}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={5} cols={4} /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
          </div>
          {!filtered.length ? (
            <div className="p-8 text-center">
              <Users size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : filtered.map((u: any) => {
            const currentRole = u.user_roles?.[0]?.role || "student";
            return (
              <div key={u.id} className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors items-center min-h-[44px]">
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{(u.full_name || "?")[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name || "—"}</p>
                    {u.student_id && <p className="text-[10px] text-muted-foreground font-mono">{u.student_id}</p>}
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <Mail size={12} className="flex-shrink-0" /> {u.email}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground truncate">
                  {u.department || "—"}
                </div>
                <div className="col-span-2">
                  {editingUser === u.user_id ? (
                    <select
                      value={currentRole}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                      onBlur={() => setEditingUser(null)}
                      autoFocus
                      className="h-7 px-2 text-xs rounded-lg border border-input bg-background text-foreground"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setEditingUser(u.user_id)} className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${roleBadgeColors[currentRole]}`}>
                      {currentRole}
                    </button>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={11} /> {format(new Date(u.created_at), "MMM d, yyyy")}
                </div>
              </div>
            );
          })}
          {/* Mobile view */}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map((u: any) => {
              const currentRole = u.user_roles?.[0]?.role || "student";
              return (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{(u.full_name || "?")[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setEditingUser(editingUser === u.user_id ? null : u.user_id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleBadgeColors[currentRole]}`}>
                      {currentRole}
                    </button>
                  </div>
                  {editingUser === u.user_id && (
                    <div className="flex gap-1.5 flex-wrap">
                      {ROLES.map(r => (
                        <button key={r} onClick={() => handleRoleChange(u.user_id, r)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${currentRole === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
