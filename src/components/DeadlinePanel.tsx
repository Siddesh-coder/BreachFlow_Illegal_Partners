import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/types/incident";

type Owner = "DPO" | "Legal Counsel" | "InfoSec";

interface DeadlineSpec {
  id: string;
  label: string;
  trigger: string;
  /** Hours from discovery, or null for contract-specific / not-applicable */
  hours: number | null;
  owner: Owner;
  /** Whether this deadline is active for this incident */
  active: boolean;
  /** Display text for non-active or non-numeric deadlines */
  displayWhenInactive?: string;
}

function buildDeadlines(incident: Incident): DeadlineSpec[] {
  const nis2Active =
    !!incident.nis2Sector && incident.nis2Sector !== "Not Applicable";
  const insuranceActive = incident.cyberInsurance === true;

  return [
    {
      id: "gdpr_33",
      label: "GDPR Art. 33",
      trigger: "Becoming aware",
      hours: 72,
      owner: "DPO",
      active: true,
    },
    {
      id: "nis2_early",
      label: "NIS2 Early Warning",
      trigger: "Significant incident",
      hours: 24,
      owner: "InfoSec",
      active: nis2Active,
      displayWhenInactive: "Not applicable",
    },
    {
      id: "nis2_incident",
      label: "NIS2 Incident Notification",
      trigger: "Becoming aware",
      hours: 72,
      owner: "DPO",
      active: nis2Active,
      displayWhenInactive: "Not applicable",
    },
    {
      id: "nis2_final",
      label: "NIS2 Final Report",
      trigger: "Becoming aware",
      hours: 24 * 30,
      owner: "DPO",
      active: nis2Active,
      displayWhenInactive: "Not applicable",
    },
    {
      id: "insurance",
      label: "Insurance Notification",
      trigger: "Becoming aware",
      hours: 36, // 24-48h midpoint
      owner: "Legal Counsel",
      active: insuranceActive,
      displayWhenInactive: "Not applicable",
    },
    {
      id: "dpa",
      label: "DPA Notification",
      trigger: "Processor detects",
      hours: null,
      owner: "Legal Counsel",
      active: true,
      displayWhenInactive: "Contract-specific",
    },
  ];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRemaining(ms: number, totalMs: number) {
  const expired = ms <= 0;
  const abs = Math.abs(ms);

  // Use day formatting for long deadlines (>= 24h total)
  if (totalMs >= 24 * 3600 * 1000) {
    const days = Math.floor(abs / (24 * 3600 * 1000));
    const hours = Math.floor((abs % (24 * 3600 * 1000)) / 3600000);
    return `${expired ? "−" : ""}${days}d ${pad(hours)}h`;
  }

  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return `${expired ? "−" : ""}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface DeadlineCardProps {
  spec: DeadlineSpec;
  discoveredAt: string;
  completed: boolean;
  onToggleComplete: () => void;
}

function DeadlineCard({
  spec,
  discoveredAt,
  completed,
  onToggleComplete,
}: DeadlineCardProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!spec.active || spec.hours == null || completed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [spec.active, spec.hours, completed]);

  const inactive = !spec.active;
  const isContract = spec.hours == null;

  const totalMs = (spec.hours ?? 0) * 3600 * 1000;
  const deadlineMs = new Date(discoveredAt).getTime() + totalMs;
  const remaining = deadlineMs - now;

  // Tone: green > 25%, amber <= 25%, red <= 10%, expired = red
  let tone: "ok" | "warn" | "danger" = "ok";
  if (spec.active && !isContract && !completed) {
    const ratio = remaining / totalMs;
    if (remaining <= 0 || ratio <= 0.1) tone = "danger";
    else if (ratio <= 0.25) tone = "warn";
  }

  const toneCls =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-warning"
        : "text-success";

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-sm shadow-card p-5 flex flex-col",
        inactive && "opacity-50",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {spec.label}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground/70">
        {spec.trigger}
      </div>

      <div
        className={cn(
          "mt-4 font-serif text-[28px] leading-none tabular-nums",
          completed
            ? "text-success"
            : inactive || isContract
              ? "text-muted-foreground"
              : toneCls,
        )}
      >
        {completed
          ? "✓ Done"
          : inactive
            ? spec.displayWhenInactive ?? "—"
            : isContract
              ? spec.displayWhenInactive ?? "—"
              : formatRemaining(remaining, totalMs)}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {spec.owner}
        </span>
        {spec.active && !isContract && (
          <button
            onClick={onToggleComplete}
            className="text-[10px] uppercase tracking-[0.16em] border border-border rounded-sm px-2 py-1 hover:bg-accent transition-colors"
          >
            {completed ? "Reopen" : "Mark Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

interface DeadlinePanelProps {
  incident: Incident;
  className?: string;
}

/**
 * Multi-deadline countdown panel. Persists per-incident "completed" flags
 * in localStorage so demo state survives reloads but no schema change is needed.
 */
export function DeadlinePanel({ incident, className }: DeadlinePanelProps) {
  const storageKey = `BG_DEADLINES_${incident.id}`;
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, storageKey]);

  const specs = buildDeadlines(incident);

  return (
    <section className={cn("", className)}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Active deadlines
          </div>
          <h2 className="font-serif text-xl mt-1">Response timeline</h2>
        </div>
        <div className="text-[11px] text-muted-foreground">
          From discovery · {new Date(incident.discoveredAt).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {specs.map((s) => (
          <DeadlineCard
            key={s.id}
            spec={s}
            discoveredAt={incident.discoveredAt}
            completed={!!completed[s.id]}
            onToggleComplete={() =>
              setCompleted((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
            }
          />
        ))}
      </div>
    </section>
  );
}
