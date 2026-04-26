import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { countMatched, deriveRegime } from "@/lib/indicators";
import type { Incident } from "@/types/incident";
import { cn } from "@/lib/utils";

function caseStatusLabel(i: Incident) {
  const cls = i.classifications ?? [];
  if (cls.length > 0) return { label: "CLASSIFIED", cls: "border-success/40 text-success bg-success/5" };
  if (i.status === "in_progress") {
    return { label: "CLASSIFICATION IN PROGRESS", cls: "border-warning/40 text-warning bg-warning/5" };
  }
  return { label: "READY FOR LEGAL REVIEW", cls: "border-primary/40 text-foreground bg-primary/5" };
}

/** Shortest active deadline in hours from discovery (smaller = more urgent). */
function shortestDeadlineHours(i: Incident): { hours: number; label: string } {
  const candidates: { hours: number; label: string }[] = [
    { hours: 72, label: "GDPR Art. 33" },
  ];
  if (i.nis2Sector && i.nis2Sector !== "Not Applicable") {
    candidates.push({ hours: 24, label: "NIS2 Early Warning" });
  }
  if (i.cyberInsurance) {
    candidates.push({ hours: 36, label: "Insurance" });
  }
  return candidates.sort((a, b) => a.hours - b.hours)[0];
}

function deadlineRemainingMs(discoveredAt: string, hours: number) {
  return new Date(discoveredAt).getTime() + hours * 3600 * 1000 - Date.now();
}

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return `expired ${formatDistanceToNowStrict(new Date(Date.now() + ms))} ago`;
  }
  return `${formatDistanceToNowStrict(new Date(Date.now() + ms))} left`;
}

const LegalCases = () => {
  const { incidents } = useApp();

  const sorted = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const da = deadlineRemainingMs(a.discoveredAt, shortestDeadlineHours(a).hours);
      const db = deadlineRemainingMs(b.discoveredAt, shortestDeadlineHours(b).hours);
      return da - db;
    });
  }, [incidents]);

  return (
    <div className="px-10 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-2">
        <h1 className="font-serif text-[36px] leading-tight">Case Files</h1>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {sorted.length} cases · sorted by urgency
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Incidents prepared by ARIA for legal review. Verdicts are not shown — only indicator counts and facts.
      </p>

      <div className="space-y-3">
        {sorted.map((i) => {
          const r = deriveRegime(i, "gdpr_33");
          const { matched, total } = countMatched(r.criteria);
          const status = caseStatusLabel(i);
          const dl = shortestDeadlineHours(i);
          const remaining = deadlineRemainingMs(i.discoveredAt, dl.hours);
          const expired = remaining <= 0;

          return (
            <Link
              key={i.id}
              to={`/legal/cases/${i.id}`}
              className="block bg-card border border-border shadow-card rounded-sm p-5 hover:bg-accent transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-[120px_90px_1fr_auto_auto_16px] gap-4 items-center min-w-0">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-muted-foreground truncate">#{i.id}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {format(new Date(i.reportedAt), "d LLL yyyy")}
                  </div>
                </div>

                <SeverityBadge severity={i.severity} />

                <div className="text-sm min-w-0">
                  <div className="text-[13px] text-foreground leading-snug truncate">
                    {i.aiSummary}
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.18em] border rounded-sm px-2 py-1 w-fit whitespace-nowrap",
                    status.cls,
                  )}
                >
                  {status.label}
                </span>

                <div className="text-right whitespace-nowrap">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {dl.label}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[12px] tabular-nums",
                      expired ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatRemaining(remaining)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          );
        })}
        {sorted.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No cases pending legal review.
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalCases;
