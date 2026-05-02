import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, ListTodo, User as UserIcon, CheckSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Profile", url: "/profile", icon: UserIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <CheckSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sidebar-foreground truncate">TaskFlow</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Team manager</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-3">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-sidebar-foreground">Your role</span>
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px]">
                  {isAdmin ? "Admin" : "Member"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAdmin
                  ? "You can manage projects, members, and tasks."
                  : "View projects and update assigned tasks."}
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
