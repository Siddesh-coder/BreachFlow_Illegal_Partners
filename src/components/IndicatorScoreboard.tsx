import { Check, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countMatched,
  deriveRegime,
  nextOverride,
  type RegimeId,
} from "@/lib/indicators";
import type { IndicatorStatus, Incident } from "@/types/incident";

interface IndicatorScoreboardProps {
  incident: Incident;
  regime: RegimeId;
  /** Show the "indicators — not a legal conclusion" sub-label (used in Legal Counsel view) */
  showIndicatorOnlyLabel?: boolean;
  /** Show source reference per row */
  showSources?: boolean;
  /** If provided, criteria become clickable and call this with the new status */
  onOverride?: (criterionId: string, next: IndicatorStatus) => void;
  className?: string;
}

const STATUS_LABEL: Record<IndicatorStatus, string> = {
  matched: "matched",
  open: "open",
  unclear: "unclear",
};

export function IndicatorScoreboard({
  incident,
  regime,
  showIndicatorOnlyLabel = false,
  showSources = false,
  onOverride,
  className,
}: IndicatorScoreboardProps) {
  const r = deriveRegime(incident, regime);
  const { matched, total } = countMatched(r.criteria);

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-sm shadow-card",
        className,
      )}
    >
      <div className="px-7 pt-6 pb-4 border-b border-border">
        <h3 className="font-serif text-[18px] leading-tight">{r.title}</h3>
        {showIndicatorOnlyLabel && (
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            indicators — not a legal conclusion
          </div>
        )}
      </div>

      <ul className="px-7 py-5 space-y-3">
        {r.criteria.map((c) => {
          const isMatched = c.status === "matched";
          const isOpen = c.status === "open";
          const Icon = isMatched ? Check : isOpen ? X : HelpCircle;
          const iconCls = isMatched
            ? "text-success"
            : isOpen
              ? "text-destructive"
              : "text-muted-foreground";

          const RowEl: any = onOverride ? "button" : "div";
          return (
            <li key={c.id}>
              <RowEl
                {...(onOverride
                  ? {
                      type: "button",
                      onClick: () => onOverride(c.id, nextOverride(c.status)),
                      title: "Click to change status (Legal Counsel)",
                    }
                  : {})}
                className={cn(
                  "w-full flex items-start gap-3 text-left rounded-sm",
                  onOverride && "hover:bg-accent transition-colors px-2 -mx-2 py-1",
                )}
              >
                <Icon
                  className={cn("w-4 h-4 mt-0.5 shrink-0", iconCls)}
                  strokeWidth={2.25}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug">{c.label}</div>
                  {showSources && c.source && (
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      per {c.source}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border",
                    isMatched && "border-success/40 text-success bg-success/5",
                    isOpen && "border-destructive/40 text-destructive bg-destructive/5",
                    !isMatched && !isOpen && "border-border text-muted-foreground",
                  )}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </RowEl>
            </li>
          );
        })}
      </ul>

      <div className="px-7 pb-5">
        <div className="font-serif text-[16px]">
          {matched} of {total} criteria matched in available facts
        </div>
      </div>

      <div
        className="px-7 py-3 border-t border-border text-[11px] leading-snug"
        style={{
          // amber background: --warning is 41 64% 29% → 10% opacity
          background: "hsl(var(--warning) / 0.10)",
          color: "hsl(var(--warning))",
        }}
      >
        ⚠ Legal classification reserved for Legal Counsel
      </div>
    </div>
  );
}
