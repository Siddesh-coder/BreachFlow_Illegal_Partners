import { useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { ClassificationFactRecord } from "@/components/legal/ClassificationFactRecord";
import { SeverityBadge } from "@/components/SeverityBadge";

const LegalClassification = () => {
  const { incidents } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const sorted = useMemo(
    () =>
      [...incidents].sort(
        (a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt),
      ),
    [incidents],
  );

  const selected = id ? incidents.find((i) => i.id === id) : null;

  if (selected) {
    return (
      <div className="px-10 py-8 max-w-[1200px] mx-auto animate-fade-in">
        <button
          onClick={() => navigate("/legal/classification")}
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-3 h-3" /> All classifications
        </button>
        <ClassificationFactRecord incident={selected} />
      </div>
    );
  }

  return (
    <div className="px-10 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Classification</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
        Structured intake fact records per incident — gathered through the Sentinel
        intake schema (Blocks 0–12). Open any case to inspect the full fact record
        feeding the indicator dashboard.
      </p>

      <div className="mt-8 space-y-3">
        {sorted.map((i) => (
          <Link
            key={i.id}
            to={`/legal/classification/${i.id}`}
            className="block bg-card border border-border shadow-card rounded-sm p-5 hover:bg-accent transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-[140px_90px_1fr_auto] gap-4 items-center">
              <div className="text-xs font-mono text-muted-foreground">#{i.id}</div>
              <SeverityBadge severity={i.severity} />
              <div className="min-w-0">
                <div className="text-[13px] text-foreground leading-snug truncate">
                  {i.aiSummary}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {i.dataTypes.join(" · ")}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Open fact record →
              </span>
            </div>
          </Link>
        ))}
        {sorted.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No incidents to classify yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalClassification;
