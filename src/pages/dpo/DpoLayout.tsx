import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Wordmark } from "@/components/Wordmark";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dpo", label: "Dashboard", end: true },
  { to: "/dpo/incidents", label: "Incidents" },
  { to: "/dpo/notifications", label: "Notifications" },
  { to: "/dpo/audit", label: "Audit Trail" },
  { to: "/dpo/settings", label: "Settings" },
];

const DpoLayout = () => {
  const { user, incidents } = useApp();
  const today = useMemo(() => format(new Date(), "EEEE, d LLLL yyyy"), []);
  const location = useLocation();

  // Hide sidebar nav highlight chrome on /dpo/incidents/:id detail
  const onDetail = /^\/dpo\/incidents\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-light-shell min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-[220px] border-r border-border flex flex-col py-8 px-6 bg-background">
        <Wordmark size={20} />
        <div className="mt-10">
          <div className="font-serif text-base leading-tight">Welcome, Data Protection Officer</div>
          <div className="text-[11px] text-muted-foreground mt-1">{today}</div>
          {user && <div className="text-[11px] text-muted-foreground mt-1">{user.name}</div>}
        </div>

        <nav className="mt-12 flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "block py-2 text-[11px] uppercase tracking-[0.18em] border-l-2 pl-3 -ml-3 transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-border space-y-2">
          <a className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground cursor-pointer" href="#">
            Lifetime Stats ↗
          </a>
          <div className="text-[10px] text-muted-foreground">{incidents.length} total incidents</div>
        </div>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 overflow-y-auto", onDetail ? "" : "")}>
        <Outlet />
      </main>
    </div>
  );
};

export default DpoLayout;
