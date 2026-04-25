import { useMemo } from "react";
import { useApp } from "@/state/AppContext";
import { format } from "date-fns";

const LegalAriaReports = () => {
  const { incidents } = useApp();

  const reports = useMemo(
    () => [...incidents].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt)),
    [incidents],
  );

  return (
    <div className="px-10 py-10 max-w-[1100px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">ARIA Reports</h1>
      <p className="text-sm text-muted-foreground mt-2">
        AI-prepared incident summaries presented to Legal Counsel for review.
      </p>

      <div className="mt-8 space-y-4">
        {reports.map((i) => (
          <article key={i.id} className="bg-card border border-border shadow-card rounded-sm p-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">#{i.id}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {format(new Date(i.reportedAt), "d LLL yyyy, HH:mm")}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground capitalize">
                Severity: {i.severity}
              </span>
            </div>
            <h2 className="font-serif text-[18px] mt-2">ARIA Briefing</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{i.aiSummary}</p>
            {i.whatHappened && (
              <p className="text-sm mt-3 leading-relaxed italic text-muted-foreground">
                “{i.whatHappened}”
              </p>
            )}
          </article>
        ))}
        {reports.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No ARIA reports available.</div>
        )}
      </div>
    </div>
  );
};

export default LegalAriaReports;
