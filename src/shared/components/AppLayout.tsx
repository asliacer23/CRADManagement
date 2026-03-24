import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/shared/hooks/useAuth";
import { useMarkNotificationRead, useNotifications, useUnreadCount, useUserProfile } from "@/shared/hooks/useSupabaseData";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { CommandPalette } from "@/shared/components/CommandPalette";
import { PageErrorBoundary } from "@/shared/components/PageErrorBoundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  Archive,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  MonitorCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";

type NavSection = "Overview" | "Workspace" | "Coordination" | "Administration";

interface NavItem {
  section: NavSection;
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  exact?: boolean;
}

const navItems: NavItem[] = [
  { section: "Overview", label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["student", "adviser", "staff", "admin"], exact: true },
  { section: "Overview", label: "Defense Schedule", path: "/defense", icon: <Calendar size={18} />, roles: ["student", "adviser", "staff", "admin"], exact: true },
  { section: "Workspace", label: "Submit Research", path: "/research/submit", icon: <FileText size={18} />, roles: ["student"] },
  { section: "Workspace", label: "My Research", path: "/research/my", icon: <BookOpen size={18} />, roles: ["student"] },
  { section: "Workspace", label: "Upload Manuscript", path: "/manuscripts/upload", icon: <Upload size={18} />, roles: ["student"] },
  { section: "Workspace", label: "Payment", path: "/payments", icon: <CreditCard size={18} />, roles: ["student"], exact: true },
  { section: "Workspace", label: "Review Manuscripts", path: "/manuscripts/review", icon: <ClipboardCheck size={18} />, roles: ["adviser"] },
  { section: "Workspace", label: "Approve Research", path: "/research/approve", icon: <UserCheck size={18} />, roles: ["adviser"] },
  { section: "Workspace", label: "Remarks", path: "/remarks", icon: <MessageSquare size={18} />, roles: ["adviser"] },
  { section: "Coordination", label: "Panel Approvals", path: "/defense/panel-approvals", icon: <CheckCircle2 size={18} />, roles: ["adviser", "staff", "admin"] },
  { section: "Coordination", label: "Verify Payments", path: "/payments/verify", icon: <CreditCard size={18} />, roles: ["staff"] },
  { section: "Coordination", label: "Assign Adviser", path: "/advisers/assign", icon: <Users size={18} />, roles: ["staff"] },
  { section: "Coordination", label: "Set Defense", path: "/defense/manage", icon: <Calendar size={18} />, roles: ["staff"] },
  { section: "Coordination", label: "Final Approvals", path: "/admin/final-approvals", icon: <CheckCircle2 size={18} />, roles: ["staff", "admin"] },
  { section: "Coordination", label: "Archive", path: "/archive", icon: <Archive size={18} />, roles: ["staff", "admin"] },
  { section: "Coordination", label: "Announcements", path: "/announcements", icon: <Megaphone size={18} />, roles: ["staff", "admin"] },
  { section: "Coordination", label: "Integration Hub", path: "/integrations", icon: <GitBranch size={18} />, roles: ["staff", "admin"], exact: true },
  { section: "Coordination", label: "Student List", path: "/integrations/student-list", icon: <Users size={18} />, roles: ["staff", "admin"], exact: true },
  { section: "Coordination", label: "Request Staff from HR", path: "/integrations/hr-staff-request", icon: <UserPlus size={18} />, roles: ["staff", "admin"], exact: true },
  { section: "Coordination", label: "Request Unit from Comlab", path: "/integrations/comlab/unit-request", icon: <MonitorCheck size={18} />, roles: ["staff", "admin"], exact: true },
  { section: "Administration", label: "Manage Users", path: "/admin/users", icon: <Users size={18} />, roles: ["admin"] },
  { section: "Administration", label: "All Research", path: "/admin/research", icon: <BookOpen size={18} />, roles: ["admin"] },
  { section: "Administration", label: "System Settings", path: "/admin/settings", icon: <Settings size={18} />, roles: ["admin"] },
  { section: "Administration", label: "Audit Logs", path: "/admin/logs", icon: <ShieldCheck size={18} />, roles: ["admin"] },
];

const notificationIcons: Record<string, React.ReactNode> = {
  research: <FileText size={14} className="text-primary" />,
  manuscript: <CheckCircle2 size={14} className="text-success" />,
  payment: <CreditCard size={14} className="text-warning" />,
  defense: <Calendar size={14} className="text-secondary" />,
  system: <Bell size={14} className="text-primary" />,
  announcement: <AlertCircle size={14} className="text-accent" />,
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const userNav = navItems.filter((item) => user && item.roles.includes(user.role));
  const recentNotifications = notifications.slice(0, 5);
  const navSections = useMemo(() => {
    const sectionOrder: NavSection[] = ["Overview", "Workspace", "Coordination", "Administration"];
    return sectionOrder
      .map((section) => ({
        section,
        items: userNav.filter((item) => item.section === section),
      }))
      .filter((group) => group.items.length > 0);
  }, [userNav]);

  const commandItems = useMemo(() => {
    if (!user) return [];

    const items = [
      ...userNav.map((nav) => ({
        id: nav.path,
        label: nav.label,
        description: `Go to ${nav.label.toLowerCase()}`,
        icon: nav.icon,
        category: nav.section,
        action: () => {
          navigate(nav.path);
          setPaletteOpen(false);
        },
      })),
    ];

    items.push({
      id: "my-profile",
      label: "My Profile",
      description: "Open your profile page",
      icon: <User size={16} />,
      category: "Account",
      action: () => {
        navigate("/profile");
        setPaletteOpen(false);
      },
    });

    items.push({
      id: "notifications",
      label: "Notifications",
      description: "Open your notifications",
      icon: <Bell size={16} />,
      category: "Account",
      action: () => {
        navigate("/notifications");
        setPaletteOpen(false);
      },
    });

    items.push({
      id: "logout",
      label: "Logout",
      description: "Sign out of your account",
      icon: <LogOut size={16} />,
      category: "Account",
      action: () => {
        logout();
        setPaletteOpen(false);
      },
    });

    items.push({
      id: "theme-toggle",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: <Settings size={16} />,
      category: "Settings",
      action: () => {
        document.documentElement.classList.toggle("dark");
        setPaletteOpen(false);
      },
    });

    return items;
  }, [logout, navigate, user, userNav]);

  const roleBadge: Record<UserRole, string> = {
    student: "bg-secondary/15 text-secondary",
    adviser: "bg-primary/15 text-primary",
    staff: "bg-warning/15 text-warning",
    admin: "bg-accent/15 text-accent",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-72"}`}
      >
        <div className="flex min-h-[64px] items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <img src={logo} alt="BCP Logo" className="h-9 w-9 rounded-lg object-contain flex-shrink-0" />
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">CRAD</h1>
              <p className="text-[10px] leading-tight text-sidebar-foreground/60">Management System</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden rounded p-1 transition-colors hover:bg-sidebar-accent lg:flex"
          >
            <ChevronLeft size={14} className={`text-sidebar-foreground/60 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 lg:hidden">
            <X size={18} className="text-sidebar-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-4">
            {navSections.map((group) => (
              <div key={group.section} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
                    {group.section}
                  </p>
                ) : (
                  <div className="mx-auto h-px w-8 bg-sidebar-border/80" />
                )}

                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="relative flex-shrink-0">{item.icon}</span>

                    {!collapsed && (
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 animate-fade-in">
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {user && (
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent flex-shrink-0">
                  <span className="text-xs font-bold text-sidebar-foreground">{user.name[0]}</span>
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1 animate-fade-in">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">{user.name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${roleBadge[user.role]}`}>{user.role}</span>
                </div>
              )}
              {!collapsed && (
                <button onClick={logout} className="rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent" title="Logout">
                  <LogOut size={14} className="text-sidebar-foreground/60" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="h-14 w-full flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
            <button onClick={() => setMobileOpen(true)} className="flex-shrink-0 rounded-lg p-2 -ml-2 hover:bg-muted lg:hidden">
              <Menu size={20} className="text-foreground" />
            </button>

            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden flex-shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-muted/60 px-4 py-1.5 text-muted-foreground transition-colors hover:bg-muted sm:flex"
            >
              <Search size={14} className="transition-colors group-hover:text-foreground" />
              <span className="text-xs transition-colors">Search... Ctrl K</span>
            </button>

            <div className="ml-auto flex flex-shrink-0 items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-sky-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] border-border bg-card p-0">
                  <div className="flex items-center justify-between px-4 py-3">
                    <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
                    >
                      View more
                    </button>
                  </div>
                  <DropdownMenuSeparator className="m-0 bg-border" />
                  <div className="max-h-[360px] overflow-y-auto">
                    {!recentNotifications.length ? (
                      <div className="px-4 py-10 text-center">
                        <Bell size={28} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">No notifications yet</p>
                      </div>
                    ) : (
                      recentNotifications.map((notification: any) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            if (!notification.is_read) {
                              markRead.mutate(notification.id);
                            }
                            navigate("/notifications");
                          }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                            !notification.is_read ? "bg-primary/[0.04]" : ""
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {notificationIcons[notification.type] || <Bell size={14} className="text-primary" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
                              {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-border transition-colors hover:bg-muted">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={user?.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{user?.name[0]}</span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border bg-card">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User size={14} className="mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/notifications")} className="cursor-pointer">
                    <Bell size={14} className="mr-2" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut size={14} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageErrorBoundary key={location.pathname}>
            <div className="animate-fade-in">{children}</div>
          </PageErrorBoundary>
        </main>

        <nav className="flex flex-shrink-0 items-center justify-around border-t border-border bg-card/80 px-2 py-1 backdrop-blur-sm lg:hidden">
          {userNav.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex min-h-[44px] min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors ${
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

      <CommandPalette items={commandItems} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};
