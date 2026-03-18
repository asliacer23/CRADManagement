import React from "react";
import { Users, Search, MoreHorizontal } from "lucide-react";
import { useAllUsers } from "@/shared/hooks/useSupabaseData";
import { useState } from "react";

export const ManageUsersPage: React.FC = () => {
  const { data: users, isLoading } = useAllUsers();
  const [search, setSearch] = useState("");
  const filtered = users?.filter((u: any) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) || [];

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Users size={20} className="text-primary" /> Manage Users</h1>
          <p className="text-sm text-muted-foreground">View and manage system users</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground w-40" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Name</div><div className="col-span-4">Email</div><div className="col-span-2">Role</div><div className="col-span-2">Joined</div>
        </div>
        {!filtered.length ? (
          <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No users found</p></div>
        ) : filtered.map((u: any) => (
          <div key={u.id} className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors items-center min-h-[44px]">
            <div className="col-span-4 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{u.full_name?.[0] || "?"}</span>
              </div>
              <span className="text-sm font-medium text-foreground truncate">{u.full_name || "—"}</span>
            </div>
            <div className="col-span-4 text-sm text-muted-foreground truncate">{u.email}</div>
            <div className="col-span-2"><span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{u.user_roles?.[0]?.role || "student"}</span></div>
            <div className="col-span-2 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
          </div>
        ))}
        <div className="sm:hidden divide-y divide-border">
          {filtered.map((u: any) => (
            <div key={u.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{u.user_roles?.[0]?.role || "student"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
