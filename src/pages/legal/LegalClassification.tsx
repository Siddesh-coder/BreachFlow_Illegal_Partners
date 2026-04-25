import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useApp } from "@/state/AppContext";

const LegalClassification = () => {
  const { incidents } = useApp();

  const all = useMemo(() => {
    return incidents
      .flatMap((i) =>
        (i.classifications ?? []).map((c) => ({ incident: i, classification: c })),
      )
      .sort((a, b) => +new Date(b.classification.ts) - +new Date(a.classification.ts));
  }, [incidents]);

  return (
    <div className="px-10 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Classification</h1>
      <p className="text-sm text-muted-foreground mt-2">
        All recorded legal classifications, newest first. Each entry is versioned and immutable.
      </p>

      <div className="mt-8 space-y-3">
        {all.map(({ incident, classification: c }) => (
          <Link
            key={c.id}
            to={`/legal/cases/${incident.id}`}
            className="block bg-card border border-border shadow-card rounded-sm p-5 hover:bg-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs font-mono text-muted-foreground">#{incident.id}</div>
                <div className="font-serif text-[16px] mt-1">
                  v{c.version} · {c.authorName}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {format(new Date(c.ts), "d LLL yyyy, HH:mm")}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
                <Badge>Art. 33: {c.art33.replace("_", " ")}</Badge>
                <Badge>Art. 34: {c.art34.replace("_", " ")}</Badge>
                <Badge>NIS2: {c.nis2.replace("_", " ")}</Badge>
              </div>
            </div>
            {c.rationale && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.rationale}</p>
            )}
          </Link>
        ))}
        {all.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No classifications recorded yet. Open a case file and release a classification to populate this list.
          </div>
        )}
      </div>
    </div>
  );
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-border bg-secondary rounded-sm px-2 py-1">
      {children}
    </span>
  );
}

export default LegalClassification;
