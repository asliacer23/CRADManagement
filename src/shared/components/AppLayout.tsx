import React, { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/shared/hooks/useAuth";
import { useUserProfile } from "@/shared/hooks/useSupabaseData";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { CommandPalette } from "@/shared/components/CommandPalette";
import {
  LayoutDashboard, FileText, Upload, CreditCard, Bell, Calendar, ClipboardCheck,
  MessageSquare, Users, Settings, LogOut, Menu, X, ChevronLeft, Search,
  BookOpen, Archive, Megaphone, UserCheck, ShieldCheck, User, CheckCircle2
} from "lucide-react";
import logo from "@/assets/logo.png";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["student", "adviser", "staff", "admin"] },
  { label: "My Profile", path: "/profile", icon: <User size={18} />, roles: ["student", "adviser", "staff", "admin"] },
  { label: "Submit Research", path: "/research/submit", icon: <FileText size={18} />, roles: ["student"] },
  { label: "My Research", path: "/research/my", icon: <BookOpen size={18} />, roles: ["student"] },
  { label: "Upload Manuscript", path: "/manuscripts/upload", icon: <Upload size={18} />, roles: ["student"] },
  { label: "Payment", path: "/payments", icon: <CreditCard size={18} />, roles: ["student"] },
  { label: "Notifications", path: "/notifications", icon: <Bell size={18} />, roles: ["student", "adviser", "staff", "admin"] },
  { label: "Defense Schedule", path: "/defense", icon: <Calendar size={18} />, roles: ["student", "adviser", "staff", "admin"] },
  { label: "Review Manuscripts", path: "/manuscripts/review", icon: <ClipboardCheck size={18} />, roles: ["adviser"] },
  { label: "Approve Research", path: "/research/approve", icon: <UserCheck size={18} />, roles: ["adviser"] },
  { label: "Panel Approvals", path: "/defense/panel-approvals", icon: <CheckCircle2 size={18} />, roles: ["adviser", "staff", "admin"] },
  { label: "Remarks", path: "/remarks", icon: <MessageSquare size={18} />, roles: ["adviser"] },
  { label: "Verify Payments", path: "/payments/verify", icon: <CreditCard size={18} />, roles: ["staff"] },
  { label: "Assign Adviser", path: "/advisers/assign", icon: <Users size={18} />, roles: ["staff"] },
  { label: "Set Defense", path: "/defense/manage", icon: <Calendar size={18} />, roles: ["staff"] },
  { label: "Final Approvals", path: "/admin/final-approvals", icon: <CheckCircle2 size={18} />, roles: ["staff", "admin"] },
  { label: "Archive", path: "/archive", icon: <Archive size={18} />, roles: ["staff", "admin"] },
  { label: "Announcements", path: "/announcements", icon: <Megaphone size={18} />, roles: ["staff", "admin"] },
  { label: "Manage Users", path: "/admin/users", icon: <Users size={18} />, roles: ["admin"] },
  { label: "All Research", path: "/admin/research", icon: <BookOpen size={18} />, roles: ["admin"] },
  { label: "System Settings", path: "/admin/settings", icon: <Settings size={18} />, roles: ["admin"] },
  { label: "Audit Logs", path: "/admin/logs", icon: <ShieldCheck size={18} />, roles: ["admin"] },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  const userNav = navItems.filter((n) => user && n.roles.includes(user.role));

  const commandItems = useMemo(() => {
    if (!user) return [];
    
    const items = [...userNav.map((nav) => ({
      id: nav.path,
      label: nav.label,
      description: `Go to ${nav.label.toLowerCase()}`,
      icon: nav.icon,
      category: "Navigation",
      action: () => { navigate(nav.path); setPaletteOpen(false); },
    }))];

    // Add common actions
    items.push({
      id: "logout",
      label: "Logout",
      description: "Sign out of your account",
      icon: <LogOut size={16} />,
      category: "Account",
      action: () => { logout(); setPaletteOpen(false); },
    });

    items.push({
      id: "theme-toggle",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: <Settings size={16} />,
      category: "Settings",
      action: () => { 
        const html = document.documentElement;
        html.classList.toggle("dark");
        setPaletteOpen(false);
      },
    });

    return items;
  }, [user, navigate, logout]);

  const roleBadge: Record<UserRole, string> = {
    student: "bg-secondary/15 text-secondary",
    adviser: "bg-primary/15 text-primary",
    staff: "bg-warning/15 text-warning",
    admin: "bg-accent/15 text-accent",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border min-h-[64px]">
          <img src={logo} alt="BCP Logo" className="h-9 w-9 rounded-lg object-contain flex-shrink-0" />
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight">CRAD</h1>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Management System</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto p-1 rounded hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft size={14} className={`text-sidebar-foreground/60 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1">
            <X size={18} className="text-sidebar-foreground" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {userNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                } ${collapsed ? "justify-center" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span className="truncate animate-fade-in">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          {user && (
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={user.name} 
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-sidebar-foreground">{user.name[0]}</span>
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge[user.role]}`}>
                    {user.role}
                  </span>
                </div>
              )}
              {!collapsed && (
                <button onClick={logout} className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors" title="Logout">
                  <LogOut size={14} className="text-sidebar-foreground/60" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="w-full h-14 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 lg:px-6 h-full gap-3">
            {/* Left: Menu button */}
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted flex-shrink-0">
              <Menu size={20} className="text-foreground" />
            </button>
            
            {/* Center: Search bar */}
            <button 
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted transition-colors cursor-pointer group flex-shrink-0"
            >
              <Search size={14} className="group-hover:text-foreground transition-colors" />
              <span className="text-xs group-hover:text-foreground transition-colors">Search... ⌘K</span>
            </button>
            
            {/* Right: Theme toggle & Profile */}
            <div className="flex items-center gap-3 ml-auto flex-shrink-0">
              <ThemeToggle />
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={user?.name} 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{user?.name[0]}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex items-center justify-around border-t border-border bg-card/80 backdrop-blur-sm px-2 py-1 flex-shrink-0">
          {userNav.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {item.icon}
              <span className="text-[9px] font-medium">{item.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Command Palette */}
      <CommandPalette items={commandItems} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};
