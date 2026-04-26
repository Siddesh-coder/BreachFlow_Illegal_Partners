import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, FileSearch, AlertCircle } from "lucide-react";
import type { Incident } from "@/types/incident";
import {
  getClassificationForIncident,
  type ClassificationField,
  type Confidence,
} from "@/data/classificationSchema";
import { cn } from "@/lib/utils";

const CONF_STYLE: Record<Confidence, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  verified: { label: "Verified", cls: "text-success border-success/30 bg-success/5", Icon: CheckCircle2 },
  extracted: { label: "Extracted", cls: "text-foreground border-border bg-secondary", Icon: FileSearch },
  estimated: { label: "Estimated", cls: "text-warning border-warning/30 bg-warning/5", Icon: AlertCircle },
  open: { label: "Open", cls: "text-muted-foreground border-border bg-muted", Icon: CircleDashed },
};

function renderAnswer(a: ClassificationField["answer"]) {
  if (a === null) return <span className="text-muted-foreground italic">Not yet provided</span>;
  if (Array.isArray(a)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {a.map((v) => (
          <span
            key={v}
            className="inline-block text-[12px] px-2 py-0.5 rounded-sm border border-border bg-secondary"
          >
            {v}
          </span>
        ))}
      </div>
    );
  }
  return <span className="text-[13px] leading-snug">{a}</span>;
}

interface Props {
  incident: Incident;
  /** When true, render compactly (no heading); used inside per-case overview. */
  embedded?: boolean;
}

export function ClassificationFactRecord({ incident, embedded = false }: Props) {
  const blocks = getClassificationForIncident(incident);
  const total = blocks.reduce((n, b) => n + b.fields.length, 0);
  const open = blocks.reduce(
    (n, b) => n + b.fields.filter((f) => f.confidence === "open").length,
    0,
  );

  return (
    <div className={cn(!embedded && "px-10 py-10 max-w-[1200px] mx-auto animate-fade-in")}>
      {!embedded && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Classification fact record
          </div>
          <h1 className="font-serif text-[36px] leading-tight mt-1">
            Incident #{incident.id}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Structured intake gathered by ARIA following the Sentinel intake schema (Blocks 0–12).
            Facts only — legal classification under Art. 33 / Art. 34 GDPR remains with Legal Counsel.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap mb-5 text-[11px]">
        <span className="uppercase tracking-[0.18em] text-muted-foreground">
          {total - open}/{total} fields populated
        </span>
        {open > 0 && (
          <span className="text-warning border border-warning/30 bg-warning/5 rounded-sm px-2 py-0.5">
            {open} open · staged supplementation under Art. 33(4)
          </span>
        )}
        <Link
          to={`/legal/cases/${incident.id}`}
          className="ml-auto text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          ← Back to case overview
        </Link>
      </div>

      <div className="space-y-4">
        {blocks.map((b) => (
          <section
            key={b.id}
            className="bg-card border border-border shadow-card rounded-sm"
          >
            <header className="px-5 py-3 border-b border-border">
              <h2 className="font-serif text-[18px] leading-tight">{b.title}</h2>
              {b.subtitle && (
                <div className="text-[11px] text-muted-foreground mt-0.5">{b.subtitle}</div>
              )}
            </header>
            <div className="divide-y divide-border">
              {b.fields.map((f) => {
                const conf = CONF_STYLE[f.confidence];
                const ConfIcon = conf.Icon;
                return (
                  <div
                    key={f.id}
                    className="px-5 py-3 grid grid-cols-1 md:grid-cols-[80px_1fr_120px] gap-3 md:gap-5 items-start"
                  >
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {f.id}
                      {f.criterion && (
                        <div className="text-[10px] uppercase tracking-[0.16em] mt-0.5">
                          {f.criterion}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
                        {f.label}
                        {f.required && (
                          <span className="text-[9px] uppercase tracking-[0.16em] text-destructive/80 border border-destructive/30 rounded-sm px-1">
                            mandatory
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5">{renderAnswer(f.answer)}</div>
                      {f.sourceNote && (
                        <div className="text-[11px] italic text-muted-foreground mt-1.5">
                          {f.sourceNote}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-[0.16em] border rounded-sm px-2 py-1 inline-flex items-center gap-1.5 w-fit",
                        conf.cls,
                      )}
                    >
                      <ConfIcon className="w-3 h-3" />
                      {conf.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
