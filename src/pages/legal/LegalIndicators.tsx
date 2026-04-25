import { useMemo } from "react";
import { useApp } from "@/state/AppContext";
import { deriveRegime, countMatched } from "@/lib/indicators";

const LegalIndicators = () => {
  const { incidents } = useApp();

  const rows = useMemo(() => {
    return incidents.map((i) => {
      const r33 = deriveRegime(i, "gdpr_33");
      const r34 = deriveRegime(i, "gdpr_34");
      const m33 = countMatched(r33.criteria);
      const m34 = countMatched(r34.criteria);
      return { i, m33, m34 };
    });
  }, [incidents]);

  return (
    <div className="px-10 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Indicators</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Indicator scoreboards across active and recent incidents. Numbers shown — never verdicts.
      </p>

      <div className="mt-8 space-y-3">
        {rows.map(({ i, m33, m34 }) => (
          <div
            key={i.id}
            className="bg-card border border-border shadow-card rounded-sm p-5 grid grid-cols-1 md:grid-cols-[160px_1fr_140px_140px] gap-4 items-center"
          >
            <div>
              <div className="text-xs font-mono text-muted-foreground">#{i.id}</div>
              <div className="text-[11px] text-muted-foreground mt-1 capitalize">{i.severity}</div>
            </div>
            <div className="text-sm font-serif truncate">{i.aiSummary}</div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Art. 33</div>
              <div className="text-sm tabular-nums">{m33.matched} / {m33.total}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Art. 34</div>
              <div className="text-sm tabular-nums">{m34.matched} / {m34.total}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No indicators to show.</div>
        )}
      </div>
    </div>
  );
};

export default LegalIndicators;
