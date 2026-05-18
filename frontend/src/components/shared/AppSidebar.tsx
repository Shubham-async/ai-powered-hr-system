import {
  Briefcase,
  ClipboardList,
  FileText,
  Calendar,
  Gift,
  LayoutDashboard,
  Users,
  Bot,
  BarChart2,
  FolderKanban,
  CalendarOff,
  CalendarCheck,
  Mail,
} from "lucide-react";
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
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const { state } = useSidebar();
  const { isCandidate, isHR } = useAuth();
  const collapsed = state === "collapsed";

  const hrMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Aurion (AI)", url: "/dashboard/huria", icon: Bot },
  ];

  const hiringItems = [
    { title: "Job Descriptions", url: "/dashboard/jd", icon: FileText },
    { title: "Candidates", url: "/dashboard/resume", icon: Users },
    { title: "Assessments", url: "/dashboard/assessment", icon: ClipboardList },
    // { title: "Interviews", url: "/dashboard/interview", icon: Calendar },
    // { title: "Offers", url: "/dashboard/offer", icon: Gift },
  ];

  const workforceItems = [
    { title: "Leave Management", url: "/dashboard/leave", icon: CalendarCheck },
    { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
    { title: "Mail Log", url: "/dashboard/mail-log", icon: Mail },
  ];

  const candidateMenuItems = [
    { title: "Dashboard", url: "/candidate", icon: LayoutDashboard },
    // { title: "My Tests", url: "/candidate/tests", icon: ClipboardList },
    // { title: "My Leaves", url: "/candidate/my-leaves", icon: CalendarOff },
    // { title: "Interviews", url: "/candidate/interviews", icon: Calendar },
    // { title: "Offers", url: "/candidate/offers", icon: Gift },
    // { title: "Onboarding", url: "/candidate/onboarding", icon: Briefcase },
  ];

  const renderGroup = (label: string, items: typeof hrMenuItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-sidebar-foreground">
                Aurion HR
              </span>
            )}
          </div>
        </div>

        {isCandidate ? (
          renderGroup("Menu", candidateMenuItems)
        ) : (
          <>
            {renderGroup("Main", hrMenuItems)}
            {isHR && (
              <>
                {renderGroup("Hiring Pipeline", hiringItems)}
                {renderGroup("Workforce", workforceItems)}
              </>
            )}
            {!isHR && (
              <SidebarGroup>
                <SidebarGroupLabel>Workforce</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/dashboard/my-leaves" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                          <CalendarOff className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>My Leaves</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/dashboard/projects" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                          <FolderKanban className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>My Projects</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

