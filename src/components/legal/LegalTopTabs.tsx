import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/legal", label: "Overview", end: true },
  { to: "/legal/draft-review", label: "Drafts" },
  { to: "/legal/response-workflow", label: "Response Workflow" },
];

export function LegalTopTabs() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="px-6 flex items-center gap-7 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={cn(
              "py-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border-b-2 border-transparent -mb-px",
            )}
            activeClassName="text-foreground font-semibold border-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
