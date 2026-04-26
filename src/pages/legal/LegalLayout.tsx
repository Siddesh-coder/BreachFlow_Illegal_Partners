import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FileText, Gavel, FilePen, ShieldAlert, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Wordmark } from "@/components/Wordmark";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";
import { LegalTopTabs } from "@/components/legal/LegalTopTabs";

const NAV = [
  { to: "/legal", label: "Case Files", icon: FileText, end: true },
  { to: "/legal/classification", label: "Classification", icon: Gavel },
  { to: "/legal/draft-review", label: "Draft Review", icon: FilePen },
  { to: "/legal/privilege-log", label: "Privilege Log", icon: ShieldAlert },
];

function LegalSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const today = useMemo(() => format(new Date(), "EEEE, d LLLL yyyy"), []);
  const { user, signOutUser } = useApp();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className={cn("flex items-center", collapsed ? "justify-center py-2" : "px-2 py-3")}>
          {collapsed ? (
            <Wordmark size={16} showMark />
          ) : (
            <div className="flex flex-col gap-1">
              <Wordmark size={18} />
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground pl-1">
                Legal Counsel Workspace
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                      activeClassName="text-foreground bg-accent"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {!collapsed ? (
          <div className="px-2 py-3 space-y-1.5">
            <div className="text-[11px] text-muted-foreground">{today}</div>
            <div className="text-sm font-serif">
              Welcome, {user?.name ?? "Legal Counsel"}
            </div>
            <button
              onClick={() => {
                signOutUser();
                navigate("/auth");
              }}
              className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              signOutUser();
              navigate("/auth");
            }}
            className="mx-auto my-2 p-2 text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

const LegalLayout = () => {
  const location = useLocation();
  // current path label for header
  const heading = useMemo(() => {
    const m = NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
    );
    if (location.pathname.startsWith("/legal/cases/")) return "Case File";
    return m?.label ?? "Case Files";
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="app-light-shell min-h-screen flex w-full bg-background">
        <LegalSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4">
            <SidebarTrigger />
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {heading}
            </div>
            <div className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
              ⚠ Legal classification reserved for Legal Counsel
            </div>
          </header>

          <LegalTopTabs />

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LegalLayout;
