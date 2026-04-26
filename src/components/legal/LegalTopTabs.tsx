import { useLocation, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", basePath: "/legal/overview", matches: ["/legal/overview", "/legal/cases/"] },
  { key: "response-workflow", label: "Response Map", basePath: "/legal/response-workflow", matches: ["/legal/response-workflow"] },
  { key: "classification", label: "Classification", basePath: "/legal/classification", matches: ["/legal/classification"] },
];

export function LegalTopTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const caseMatch = location.pathname.match(/^\/legal\/cases\/([^/]+)/);
  const caseId = params.id ?? caseMatch?.[1];

  const isActive = (tab: typeof TABS[number]) =>
    tab.matches.some((m) => location.pathname === m || location.pathname.startsWith(m));

  const handleClick = (tab: typeof TABS[number]) => {
    if (tab.key === "overview" && caseId) {
      navigate(`/legal/cases/${caseId}`);
    } else {
      navigate(tab.basePath);
    }
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="px-6 flex items-center gap-7 overflow-x-auto">
        {TABS.map((t) => {
          const active = isActive(t);
          return (
            <button
              key={t.key}
              onClick={() => handleClick(t)}
              className={cn(
                "py-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap border-b-2 border-transparent -mb-px bg-transparent",
                active && "text-foreground font-semibold border-foreground",
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
